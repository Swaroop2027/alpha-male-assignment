import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import SupportTicket from "../models/SupportTicket.js";
import Review from "../models/Review.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// @desc    Public Order Tracking (Order ID + Phone Verification)
// @route   POST /api/post-purchase/track
// @access  Public
export const trackOrder = async (req, res, next) => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      throw new ApiError("Please provide both Order ID and Phone Number", 400);
    }

    const order = await Order.findOne({
      orderId: orderId.trim(),
      "customer.phone": phone.trim(),
    }).select("-razorpay.signature");

    if (!order) {
      throw new ApiError(
        "No order found matching this Order ID and Phone Number",
        404,
      );
    }

    return sendResponse(res, 200, "Order tracking details retrieved", {
      orderId: order.orderId,
      status: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: order.items,
      shippingAddress: {
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
      },
      courier: order.courier,
      statusTimeline: order.statusHistory,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RETURNS & REFUNDS (7-DAY RETURN WINDOW)
// ==========================================

// @desc    Create Return Request (Customer)
// @route   POST /api/post-purchase/returns
// @access  Public
export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, phone, items, reason, description, photoUrl } = req.body;

    if (!orderId || !phone || !items || items.length === 0 || !reason) {
      throw new ApiError(
        "Please provide Order ID, phone, return items, and reason",
        400,
      );
    }

    const order = await Order.findOne({
      orderId: orderId.trim(),
      "customer.phone": phone.trim(),
    });
    if (!order) {
      throw new ApiError("Order not found with provided details", 404);
    }

    // Must be Delivered to return
    if (order.orderStatus !== "Delivered") {
      throw new ApiError(
        "Returns can only be requested for orders that have been successfully Delivered",
        400,
      );
    }

    // 7-day Return Window Check
    const deliveredLog = order.statusHistory.find(
      (log) => log.status === "Delivered",
    );
    const deliveredDate = deliveredLog
      ? new Date(deliveredLog.updatedAt)
      : new Date(order.updatedAt);
    const daysSinceDelivery =
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDelivery > 7) {
      throw new ApiError(
        "The 7-day return window for this order has expired",
        400,
      );
    }

    // Calculate refund amount for returning items
    const refundAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const returnRequest = await ReturnRequest.create({
      order: order._id,
      orderId: order.orderId,
      customer: order.customer,
      items,
      reason,
      description: description || "",
      photoUrl: photoUrl || "",
      status: "Requested",
      refundAmount,
    });

    return sendResponse(
      res,
      201,
      "Return request submitted successfully. Our team will review within 24 hours.",
      {
        returnRequest,
      },
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Return Requests (Admin, Operations)
// @route   GET /api/post-purchase/returns
// @access  Private (Admin, Operations)
export const getReturnRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};

    const returns = await ReturnRequest.find(query).sort({ createdAt: -1 });
    return sendResponse(res, 200, "Return requests retrieved", { returns });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Return Request Status (Admin, Operations)
// @route   PATCH /api/post-purchase/returns/:id/status
// @access  Private (Admin, Operations)
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const allowed = [
      "Requested",
      "Approved",
      "Rejected",
      "Picked up",
      "Refunded",
    ];
    if (!allowed.includes(status)) {
      throw new ApiError(
        `Invalid return status. Allowed: ${allowed.join(", ")}`,
        400,
      );
    }

    const returnDoc = await ReturnRequest.findById(id);
    if (!returnDoc) throw new ApiError("Return request not found", 404);

    returnDoc.status = status;
    if (adminNotes) returnDoc.adminNotes = adminNotes;
    returnDoc.processedBy = req.user._id;

    await returnDoc.save();

    // If marked Refunded, also update Order status to 'Returned'
    if (status === "Refunded") {
      await Order.findByIdAndUpdate(returnDoc.order, {
        orderStatus: "Returned",
        paymentStatus: "Refunded",
      });
    }

    return sendResponse(res, 200, `Return status updated to ${status}`, {
      returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUPPORT TICKETS
// ==========================================

// @desc    Create Support Ticket
// @route   POST /api/post-purchase/tickets
// @access  Public
export const createTicket = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      orderId,
      subject,
      message,
      priority,
    } = req.body;

    if (!customerName || !customerPhone || !subject || !message) {
      throw new ApiError("Name, phone, subject, and message are required", 400);
    }

    let linkedOrder = null;
    if (orderId) {
      linkedOrder = await Order.findOne({ orderId: orderId.trim() });
    }

    const count = await SupportTicket.countDocuments();
    const ticketId = `TKT-${1001 + count}`;

    const ticket = await SupportTicket.create({
      ticketId,
      order: linkedOrder ? linkedOrder._id : null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      subject,
      priority: priority || "Medium",
      status: "Open",
      messages: [
        {
          sender: "Customer",
          senderName: customerName,
          message,
          isInternal: false,
          createdAt: new Date(),
        },
      ],
    });

    return sendResponse(res, 201, `Ticket #${ticketId} created successfully`, {
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Tickets (Sales/Support, Admin)
// @route   GET /api/post-purchase/tickets
// @access  Private (Sales/Support, Admin)
export const getTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};

    const tickets = await SupportTicket.find(query)
      .populate("order", "orderId totalAmount orderStatus")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, "Support tickets retrieved", { tickets });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to Support Ticket
// @route   POST /api/post-purchase/tickets/:id/reply
// @access  Private (Sales/Support, Admin)
export const replyTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false, newStatus } = req.body;

    if (!message) throw new ApiError("Message text is required", 400);

    const ticket = await SupportTicket.findById(id);
    if (!ticket) throw new ApiError("Ticket not found", 404);

    ticket.messages.push({
      sender: "SupportAgent",
      senderName: req.user.name,
      message,
      isInternal,
      createdAt: new Date(),
    });

    if (newStatus && ["Open", "In progress", "Closed"].includes(newStatus)) {
      ticket.status = newStatus;
    }

    await ticket.save();

    return sendResponse(res, 200, "Reply added to ticket", { ticket });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRODUCT REVIEWS
// ==========================================

// @desc    Submit Product Review
// @route   POST /api/post-purchase/reviews
// @access  Public
export const submitReview = async (req, res, next) => {
  try {
    const { productId, customerName, rating, comment } = req.body;

    if (!productId || !customerName || !rating || !comment) {
      throw new ApiError(
        "Please provide product, customer name, rating (1-5), and review comment",
        400,
      );
    }

    const review = await Review.create({
      product: productId,
      customerName,
      rating: Number(rating),
      comment,
      isApproved: false, // Admin approval required!
    });

    return sendResponse(
      res,
      201,
      "Thank you! Your review has been submitted for moderation.",
      { review },
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get Approved Reviews for a Product
// @route   GET /api/post-purchase/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    }).sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 5.0;

    return sendResponse(res, 200, "Product reviews retrieved", {
      count: reviews.length,
      averageRating: Number(avgRating),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Reviews for Moderation (Admin, Sales/Support)
// @route   GET /api/post-purchase/reviews
// @access  Private (Admin, Sales/Support)
export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("product", "title slug images")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, "All reviews retrieved for moderation", {
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate Review (Admin approve/reject)
// @route   PATCH /api/post-purchase/reviews/:id/approve
// @access  Private (Admin, Sales/Support)
export const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true },
    );
    if (!review) throw new ApiError("Review not found", 404);

    return sendResponse(
      res,
      200,
      `Review has been ${isApproved ? "approved" : "rejected"}`,
      { review },
    );
  } catch (error) {
    next(error);
  }
};