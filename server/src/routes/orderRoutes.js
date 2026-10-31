import express from "express";
import {
  createOrder,
  verifyPayment,
  confirmCodOrder,
  retryPayment,
  razorpayWebhook,
  getOrderById,
  getMyOrders,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Public Order endpoints
router.post("/", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/:id/confirm-cod", confirmCodOrder);
router.post("/:id/retry-payment", retryPayment);
router.post("/webhook/razorpay", razorpayWebhook);
router.get("/lookup/:orderId", getOrderById);

// Customer Logged-in Order History (Module 2 Must-Have 3)
router.get("/my-orders", protect, getMyOrders);

export default router;
