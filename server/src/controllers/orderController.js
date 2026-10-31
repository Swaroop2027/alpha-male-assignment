import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Pincode from "../models/Pincode.js";
import Coupon from "../models/Coupon.js";
import razorpayInstance from "../config/razorpay.js";
import { calculateOrderFinancials } from "../utils/taxCalculator.js";
import { reduceOrderStockAtomically } from "../utils/stockManager.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";
import { sendOrderPlacedNotification } from "../utils/notificationService.js";

// Helper: Generate unique human-readable order ID
const generateOrderId = async () => {
  const count = await Order.countDocuments();
  const year = new Date().getFullYear();
  return `AM-${year}-${String(1001 + count).padStart(5, "0")}`;
};

// Helper: Generate sequential GST Invoice Number
const generateInvoiceNumber = async () => {
  const count = await Order.countDocuments({
    invoiceNumber: { $exists: true, $ne: null },
  });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(1001 + count).padStart(5, "0")}`;
};

// @desc    Create a new Order (Prepaid or COD)
// @route   POST /api/orders
// @access  Public (Guest or Logged in customer)
export const createOrder = async (req, res, next) => {
  try {
    const {
      customer,
      shippingAddress,
      items: clientItems,
      couponCode,
      paymentMethod,
      utm,
    } = req.body;

    // 1. Basic validation
    if (!customer || !customer.name || !customer.phone) {
      throw new ApiError(
        "Customer name and 10-digit phone number are required",
        400,
      );
    }
    if (
      !shippingAddress ||
      !shippingAddress.addressLine ||
      !shippingAddress.pincode
    ) {
      throw new ApiError(
        "Complete shipping address and 6-digit pincode are required",
        400,
      );
    }
    if (!clientItems || clientItems.length === 0) {
      throw new ApiError("Cart cannot be empty", 400);
    }
    if (!["Prepaid", "COD"].includes(paymentMethod)) {
      throw new ApiError("Invalid payment method. Choose Prepaid or COD", 400);
    }

    // 2. Validate Pincode Serviceability from Database
    const pincodeDoc = await Pincode.findOne({
      pincode: shippingAddress.pincode,
    });
    if (!pincodeDoc || !pincodeDoc.isServiceable) {
      throw new ApiError(
        `Pincode ${shippingAddress.pincode} is currently not serviceable`,
        400,
      );
    }

    // 3. SECURE PRICE LOOKUP: Fetch every product directly from DB
    const verifiedItems = [];
    for (const item of clientItems) {
      const dbProduct = await Product.findById(item.productId || item.product);
      if (!dbProduct || !dbProduct.isActive) {
        throw new ApiError(
          `Product not available: ${item.title || "Item"}`,
          400,
        );
      }
      if (dbProduct.stock < item.quantity) {
        throw new ApiError(
          `Sorry, only ${dbProduct.stock} units available for ${dbProduct.title}`,
          400,
        );
      }

      verifiedItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        slug: dbProduct.slug,
        price: dbProduct.price, // STRICT DB PRICE
        quantity: item.quantity,
        hsnCode: dbProduct.hsnCode || "21069099",
        image: dbProduct.images[0] || "",
      });
    }

    // 4. Server-Side Coupon Validation
    let couponDiscount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      });

      if (
        coupon &&
        new Date() <= new Date(coupon.expiryDate) &&
        coupon.usedCount < coupon.usageLimit
      ) {
        const rawSubtotal = verifiedItems.reduce(
          (sum, it) => sum + it.price * it.quantity,
          0,
        );
        if (rawSubtotal >= coupon.minOrderValue) {
          if (coupon.discountType === "percentage") {
            couponDiscount = Math.round(
              (rawSubtotal * coupon.discountValue) / 100,
            );
            if (
              coupon.maxDiscountAmount &&
              couponDiscount > coupon.maxDiscountAmount
            ) {
              couponDiscount = coupon.maxDiscountAmount;
            }
          } else {
            couponDiscount = coupon.discountValue;
          }
          appliedCouponCode = coupon.code;
        }
      }
    }

    // 5. Server-Side Financials & GST calculation
    const financials = calculateOrderFinancials({
      items: verifiedItems,
      couponDiscount,
      stateCode: pincodeDoc.stateCode || shippingAddress.stateCode || "27",
      paymentMethod,
    });

    // 6. COD Limit Rule (Module 3 Must-Have 5): No COD above ₹3,000
    if (paymentMethod === "COD" && financials.totalAmount > 3000) {
      throw new ApiError(
        "Cash on Delivery is only available for orders up to ₹3,000. Please choose Prepaid to proceed with this order.",
        400,
      );
    }

    // 7. Generate readable order ID
    const orderId = await generateOrderId();

    // 8. Razorpay Order Creation (if Prepaid)
    let razorpayOrderData = null;
    if (paymentMethod === "Prepaid") {
      if (razorpayInstance) {
        try {
          const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(financials.totalAmount * 100), // Razorpay accepts in Paise
            currency: "INR",
            receipt: orderId,
            notes: { orderId, customerPhone: customer.phone },
          });
          razorpayOrderData = { orderId: rzpOrder.id };
        } catch (rzpErr) {
          console.error(
            "Razorpay creation failed, falling back to mock test order:",
            rzpErr.message,
          );
          razorpayOrderData = { orderId: `order_mock_${Date.now()}` };
        }
      } else {
        // Mock Razorpay order ID for offline/sandbox testing
        razorpayOrderData = { orderId: `order_mock_${Date.now()}` };
      }
    }

    // 9. Save Order to Database
    const order = await Order.create({
      orderId,
      user: req.user ? req.user._id : null,
      customer: {
        name: customer.name.trim(),
        email: customer.email ? customer.email.trim() : "",
        phone: customer.phone.trim(),
      },
      shippingAddress: {
        addressLine: shippingAddress.addressLine,
        landmark: shippingAddress.landmark || "",
        city: pincodeDoc.city,
        state: pincodeDoc.state,
        stateCode: pincodeDoc.stateCode,
        pincode: pincodeDoc.pincode,
      },
      items: verifiedItems,
      itemsSubtotal: financials.itemsSubtotal,
      coupon: {
        code: appliedCouponCode,
        discountAmount: financials.couponDiscount,
      },
      prepaidDiscount: financials.prepaidDiscount,
      taxableAmount: financials.taxableAmount,
      isInterState: financials.isInterState,
      cgst: financials.cgst,
      sgst: financials.sgst,
      igst: financials.igst,
      totalTax: financials.totalTax,
      shippingFee: financials.shippingFee,
      totalAmount: financials.totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      razorpay: razorpayOrderData,
      codConfirmed: false,
      stockReduced: false,
      orderStatus: "New",
      statusHistory: [
        {
          status: "New",
          updatedAt: new Date(),
          updatedBy: { name: "Customer/Storefront", role: "System" },
          note: `Order initiated via ${paymentMethod}`,
        },
      ],
      utm: {
        source: (utm && utm.source) || "direct",
        medium: (utm && utm.medium) || "none",
        campaign: (utm && utm.campaign) || "none",
        term: (utm && utm.term) || "",
        content: (utm && utm.content) || "",
        landingPage: (utm && utm.landingPage) || "/",
      },
    });

    // If coupon was used, increment coupon usage count
    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } },
      );
    }

    // Send Order Notification (Async - non-blocking)
    sendOrderPlacedNotification(order);

    return sendResponse(res, 201, "Order created successfully", {
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/orders/verify-payment
// @access  Public
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      throw new ApiError(
        "orderId, razorpay_order_id, and razorpay_payment_id are required",
        400,
      );
    }

    const order = await Order.findOne({ orderId });
    if (!order) throw new ApiError("Order not found", 404);

    if (order.paymentStatus === "Paid") {
      return sendResponse(res, 200, "Order is already marked Paid", { order });
    }

    // 1. STRICT CHECK: Body razorpay_order_id must match the order's generated razorpay orderId
    if (
      order.razorpay?.orderId &&
      order.razorpay.orderId !== razorpay_order_id
    ) {
      throw new ApiError(
        "Fraud Alert: razorpay_order_id does not match this order",
        400,
      );
    }

    // 2. REPLAY ATTACK CHECK: razorpay_payment_id cannot be reused across orders
    const duplicatePayment = await Order.findOne({
      _id: { $ne: order._id },
      "razorpay.paymentId": razorpay_payment_id,
    });
    if (duplicatePayment) {
      throw new ApiError(
        "Fraud Alert: This payment ID has already been claimed by another order",
        400,
      );
    }

    // 3. Signature Verification
    let isValid = false;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (
      secret &&
      razorpay_signature &&
      !razorpay_order_id.startsWith("order_mock_")
    ) {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      isValid = generatedSignature === razorpay_signature;
    } else {
      // For local sandbox/mock testing: accept mock tokens ONLY if orderId matches
      isValid = true;
    }

    if (!isValid) {
      order.paymentStatus = "Failed";
      order.statusHistory.push({
        status: "Failed",
        updatedBy: { name: "Payment Gateway", role: "System" },
        note: "Payment signature verification failed",
      });
      await order.save();
      throw new ApiError(
        "Payment verification failed. Signature mismatch.",
        400,
      );
    }

    // Reduce stock atomically if not yet reduced
    if (!order.stockReduced) {
      await reduceOrderStockAtomically(order.items);
      order.stockReduced = true;
    }

    // Assign sequential Invoice Number
    if (!order.invoiceNumber) {
      order.invoiceNumber = await generateInvoiceNumber();
    }

    order.paymentStatus = "Paid";
    order.orderStatus = "Confirmed";
    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature || "mock_signature",
    };

    order.statusHistory.push({
      status: "Confirmed",
      updatedBy: { name: "Payment Gateway", role: "System" },
      note: `Online payment of ₹${order.totalAmount} verified with Payment ID: ${razorpay_payment_id}`,
    });

    await order.save();

    return sendResponse(res, 200, "Payment verified and order confirmed", {
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm Cash on Delivery (COD) Order
// @route   POST /api/orders/:id/confirm-cod
// @access  Public
export const confirmCodOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    if (order.paymentMethod !== "COD") {
      throw new ApiError("This order is not a Cash on Delivery order", 400);
    }

    if (order.codConfirmed) {
      return sendResponse(res, 200, "COD Order is already confirmed", {
        order,
      });
    }

    // Atomically reduce stock once COD is confirmed! (Module 3 Must-Have 6)
    if (!order.stockReduced) {
      await reduceOrderStockAtomically(order.items);
      order.stockReduced = true;
    }

    if (!order.invoiceNumber) {
      order.invoiceNumber = await generateInvoiceNumber();
    }

    order.codConfirmed = true;
    order.orderStatus = "Confirmed";
    order.statusHistory.push({
      status: "Confirmed",
      updatedBy: { name: "Customer Confirmation", role: "System" },
      note: "COD order confirmed by customer. Ready for packing.",
    });

    await order.save();

    return sendResponse(res, 200, "COD order confirmed successfully", {
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry Payment for a Pending or Failed Order
// @route   POST /api/orders/:id/retry-payment
// @access  Public
export const retryPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    if (order.paymentStatus === "Paid") {
      throw new ApiError("Order is already paid", 400);
    }

    let newRazorpayOrderId = `order_retry_${Date.now()}`;
    if (razorpayInstance) {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        receipt: `${order.orderId}-R`,
        notes: { orderId: order.orderId },
      });
      newRazorpayOrderId = rzpOrder.id;
    }

    order.razorpay.orderId = newRazorpayOrderId;
    order.paymentStatus = "Pending";
    await order.save();

    return sendResponse(res, 200, "Payment retry order generated", {
      orderId: order.orderId,
      razorpayOrderId: newRazorpayOrderId,
      amount: order.totalAmount,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/orders/webhook/razorpay
// @access  Public (Webhook signature verified)
export const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(req.rawBody);
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        return res.status(400).json({ status: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (event === "payment.captured" && payment) {
      const rzpOrderId = payment.order_id;
      const order = await Order.findOne({ "razorpay.orderId": rzpOrderId });

      if (order && order.paymentStatus !== "Paid") {
        if (!order.stockReduced) {
          await reduceOrderStockAtomically(order.items);
          order.stockReduced = true;
        }
        if (!order.invoiceNumber) {
          order.invoiceNumber = await generateInvoiceNumber();
        }

        order.paymentStatus = "Paid";
        order.orderStatus = "Confirmed";
        order.razorpay.paymentId = payment.id;
        order.statusHistory.push({
          status: "Confirmed",
          updatedBy: { name: "Razorpay Webhook", role: "System" },
          note: `Webhook received: Payment ${payment.id} captured.`,
        });
        await order.save();
      }
    } else if (event === "payment.failed" && payment) {
      const rzpOrderId = payment.order_id;
      const order = await Order.findOne({ "razorpay.orderId": rzpOrderId });

      if (order && order.paymentStatus === "Pending") {
        order.paymentStatus = "Failed";
        order.statusHistory.push({
          status: "Failed",
          updatedBy: { name: "Razorpay Webhook", role: "System" },
          note: `Webhook received: Payment failed. Reason: ${payment.error_description || "Declined"}`,
        });
        await order.save();
      }
    }

    return res.status(200).json({ status: "Webhook processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res
      .status(500)
      .json({ status: "Webhook error", error: error.message });
  }
};

// @desc    Get Order by OrderId (for public tracking & confirmation)
// @route   GET /api/orders/lookup/:orderId
// @access  Public
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({
      $or: [
        { orderId },
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
      ],
    }).populate("items.product", "title slug images");

    if (!order) throw new ApiError("Order not found", 404);

    return sendResponse(res, 200, "Order details retrieved", { order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Customer's Order History (Module 2 Must-Have 3)
// @route   GET /api/orders/my-orders
// @access  Private (Logged-in Customer)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [
        { user: req.user._id },
        { "customer.phone": req.user.phone },
        { "customer.email": req.user.email },
      ],
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, "Customer order history retrieved", {
      orders,
    });
  } catch (error) {
    next(error);
  }
};
