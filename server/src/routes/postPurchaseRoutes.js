import express from "express";
import {
  trackOrder,
  createReturnRequest,
  getReturnRequests,
  updateReturnStatus,
  createTicket,
  getTickets,
  replyTicket,
  submitReview,
  getProductReviews,
  getAllReviews,
  moderateReview,
} from "../controllers/postPurchaseController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public Customer Actions
router.post("/track", trackOrder);
router.post("/returns", createReturnRequest);
router.post("/tickets", createTicket);
router.post("/reviews", submitReview);
router.get("/reviews/product/:productId", getProductReviews);

// Operations / Admin Return Management
router.get(
  "/returns",
  protect,
  authorize("Admin", "Operations"),
  getReturnRequests,
);
router.patch(
  "/returns/:id/status",
  protect,
  authorize("Admin", "Operations"),
  updateReturnStatus,
);

// Sales/Support Ticket Management
router.get(
  "/tickets",
  protect,
  authorize("Admin", "Sales/Support"),
  getTickets,
);
router.post(
  "/tickets/:id/reply",
  protect,
  authorize("Admin", "Sales/Support"),
  replyTicket,
);

// Review Moderation (Admin, Sales/Support)
router.get(
  "/reviews",
  protect,
  authorize("Admin", "Sales/Support"),
  getAllReviews,
);
router.patch(
  "/reviews/:id/approve",
  protect,
  authorize("Admin", "Sales/Support"),
  moderateReview,
);

export default router;