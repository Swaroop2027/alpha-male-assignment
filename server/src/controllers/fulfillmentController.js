import PDFDocument from "pdfkit";
import Order from "../models/Order.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";
import { buildGstInvoice, buildShippingLabel } from "../utils/pdfGenerator.js";
import {
  sendOrderShippedNotification,
  sendOrderDeliveredNotification,
} from "../utils/notificationService.js";

// @desc    Get All Orders with Search, Filter & Pagination (Admin & Operations)
// @route   GET /api/fulfillment/orders
// @access  Private (Admin, Operations)
export const getOrdersList = async (req, res, next) => {
  try {
    const {
      search,
      status,
      paymentMethod,
      campaign,
      startDate,
      endDate,
      page = 1,
      limit = 15,
    } = req.query;

    const query = {};

    // 1. Search by Order ID, Customer Name, or Phone
    if (search) {
      query.$or = [
        { orderId: { $regex: search.trim(), $options: "i" } },
        { "customer.name": { $regex: search.trim(), $options: "i" } },
        { "customer.phone": { $regex: search.trim(), $options: "i" } },
      ];
    }

    // 2. Status filter
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // 3. Payment Method filter (Prepaid or COD)
    if (paymentMethod && paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // 4. UTM Campaign Source filter
    if (campaign && campaign !== "all") {
      query["utm.source"] = campaign;
    }

    // 5. Date Range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)
        query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return sendResponse(res, 200, "Orders retrieved successfully", {
      totalOrders,
      page: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Order Detail with Full Timeline & Notes
// @route   GET /api/fulfillment/orders/:id
// @access  Private (Admin, Operations, Sales/Support)
export const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    }).populate("items.product", "title slug images mrp price stock");

    if (!order) throw new ApiError("Order not found", 404);

    return sendResponse(res, 200, "Order details retrieved", { order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Order Status with Audit Log
// @route   PATCH /api/fulfillment/orders/:id/status
// @access  Private (Admin, Operations)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = [
      "New",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out for delivery",
      "Delivered",
      "Cancelled",
      "RTO",
      "Returned",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
        400,
      );
    }

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    // Assignment Rule: "Every change logs who made it and when"
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: {
        userId: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      note: note || `Status updated to ${status} by ${req.user.name}`,
    });

    await order.save();

    // Trigger Key Notification Steps (Module 5 Must-Have 2)
    if (status === "Shipped") {
      sendOrderShippedNotification(order);
    } else if (status === "Delivered") {
      sendOrderDeliveredNotification(order);
    }

    return sendResponse(res, 200, `Order status updated to ${status}`, {
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Internal Team Note
// @route   POST /api/fulfillment/orders/:id/notes
// @access  Private (Admin, Operations, Sales/Support)
export const addInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) throw new ApiError("Note text is required", 400);

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    order.internalNotes.push({
      note,
      addedBy: req.user.name,
      createdAt: new Date(),
    });

    await order.save();

    return sendResponse(res, 200, "Internal note added", { order });
  } catch (error) {
    next(error);
  }
};

// @desc    Download GST Tax Invoice as a PDF
// @route   GET /api/fulfillment/orders/:id/invoice-pdf
// @access  Public (or Protected)
export const downloadGstInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="GST-Invoice-${order.orderId}.pdf"`,
    );

    doc.pipe(res);
    buildGstInvoice(doc, order);
    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Download 4x6 inch Thermal Shipping Label as a PDF
// @route   GET /api/fulfillment/orders/:id/shipping-label-pdf
// @access  Public (or Protected)
export const downloadShippingLabel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    // 4 x 6 inch dimensions in points: [288, 432]
    const doc = new PDFDocument({ size: [288, 432], margin: 10 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="ShippingLabel-${order.orderId}.pdf"`,
    );

    doc.pipe(res);
    buildShippingLabel(doc, order);
    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action: Mark multiple orders as "Packed"
// @route   POST /api/fulfillment/bulk/pack
// @access  Private (Admin, Operations)
export const bulkMarkPacked = async (req, res, next) => {
  try {
    const { orderIds } = req.body; // Array of Order IDs

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new ApiError("Please provide an array of order IDs", 400);
    }

    const result = await Order.updateMany(
      { orderId: { $in: orderIds } },
      {
        $set: { orderStatus: "Packed" },
        $push: {
          statusHistory: {
            status: "Packed",
            updatedAt: new Date(),
            updatedBy: {
              userId: req.user._id,
              name: req.user.name,
              role: req.user.role,
            },
            note: "Bulk marked as Packed for warehouse dispatch",
          },
        },
      },
    );

    return sendResponse(
      res,
      200,
      `Successfully marked ${result.modifiedCount} orders as Packed`,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action: Print Invoices for multiple orders in one merged PDF
// @route   POST /api/fulfillment/bulk/print-invoices
// @access  Private (Admin, Operations)
export const bulkPrintInvoices = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new ApiError("Please provide an array of order IDs", 400);
    }

    const orders = await Order.find({ orderId: { $in: orderIds } });
    if (orders.length === 0)
      throw new ApiError("No orders found for the given IDs", 404);

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      autoFirstPage: false,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="Bulk-Invoices.pdf"',
    );

    doc.pipe(res);

    orders.forEach((order) => {
      doc.addPage({ size: "A4", margin: 40 });
      buildGstInvoice(doc, order);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action: Print 4x6 Thermal Labels in one merged PDF
// @route   POST /api/fulfillment/bulk/print-labels
// @access  Private (Admin, Operations)
export const bulkPrintLabels = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new ApiError("Please provide an array of order IDs", 400);
    }

    const orders = await Order.find({ orderId: { $in: orderIds } });
    if (orders.length === 0)
      throw new ApiError("No orders found for the given IDs", 404);

    const doc = new PDFDocument({
      size: [288, 432],
      margin: 10,
      autoFirstPage: false,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="Bulk-ShippingLabels.pdf"',
    );

    doc.pipe(res);

    orders.forEach((order) => {
      doc.addPage({ size: [288, 432], margin: 10 });
      buildShippingLabel(doc, order);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action: Warehouse Picklist (Total quantity of each product)
// @route   POST /api/fulfillment/bulk/picklist
// @access  Private (Admin, Operations)
export const getPicklist = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new ApiError("Please provide an array of order IDs", 400);
    }

    const orders = await Order.find({ orderId: { $in: orderIds } });

    // Aggregate quantities by product title
    const picklistMap = {};
    let totalItemsCount = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!picklistMap[item.title]) {
          picklistMap[item.title] = {
            title: item.title,
            slug: item.slug,
            hsnCode: item.hsnCode,
            totalQuantity: 0,
          };
        }
        picklistMap[item.title].totalQuantity += item.quantity;
        totalItemsCount += item.quantity;
      });
    });

    const picklist = Object.values(picklistMap);

    return sendResponse(res, 200, "Picklist generated successfully", {
      ordersCount: orders.length,
      totalItemsCount,
      picklist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book Shipment with Shiprocket API (Sandbox/Mocked)
// @route   POST /api/fulfillment/orders/:id/book-courier
// @access  Private (Admin, Operations)
export const bookCourier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
      ],
    });

    if (!order) throw new ApiError("Order not found", 404);

    if (order.courier?.awbNumber) {
      return sendResponse(res, 200, "Shipment is already booked with courier", {
        courier: order.courier,
      });
    }

    // Shiprocket Mock/Sandbox generation
    const mockAwb = `SR-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const mockBookingId = `SR-BK-${Date.now()}`;
    const trackingUrl = `https://shiprocket.co/tracking/${mockAwb}`;

    order.courier = {
      name: "Shiprocket Express (Bluedart/Delhivery)",
      bookingId: mockBookingId,
      awbNumber: mockAwb,
      trackingUrl,
      bookedAt: new Date(),
    };

    order.orderStatus = "Shipped";
    order.statusHistory.push({
      status: "Shipped",
      updatedAt: new Date(),
      updatedBy: {
        userId: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      note: `Shipment booked with Shiprocket. AWB: ${mockAwb}`,
    });

    await order.save();

    // Trigger Notification for Order Shipped
    sendOrderShippedNotification(order);

    return sendResponse(res, 200, "Courier shipment booked successfully", {
      orderId: order.orderId,
      courier: order.courier,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Courier Webhook (Mock/Real updates: Shipped -> Out for delivery -> Delivered)
// @route   POST /api/fulfillment/webhook/courier
// @access  Public
export const courierWebhook = async (req, res, next) => {
  try {
    const { awbNumber, current_status, location } = req.body;

    if (!awbNumber || !current_status) {
      return res
        .status(400)
        .json({ success: false, message: "awbNumber and current_status required" });
    }

    const order = await Order.findOne({ "courier.awbNumber": awbNumber });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order with this AWB not found" });
    }

    const statusMap = {
      IN_TRANSIT: "Shipped",
      OUT_FOR_DELIVERY: "Out for delivery",
      DELIVERED: "Delivered",
      RTO_INITIATED: "RTO",
    };

    const mappedStatus =
      statusMap[current_status.toUpperCase()] || current_status;

    order.orderStatus = mappedStatus;
    order.statusHistory.push({
      status: mappedStatus,
      updatedAt: new Date(),
      updatedBy: { name: "Courier Webhook (Shiprocket)", role: "System" },
      note: `Courier update: ${current_status} at ${location || "Hub"}`,
    });

    await order.save();

    if (mappedStatus === "Delivered") {
      sendOrderDeliveredNotification(order);
    }

    return res
      .status(200)
      .json({ success: true, message: "Courier status updated" });
  } catch (error) {
    console.error("Courier webhook error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
