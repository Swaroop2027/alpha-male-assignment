import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.post("/validate", validateCoupon);
router.get("/", protect, authorize("Admin"), getCoupons);
router.post("/", protect, authorize("Admin"), createCoupon);

export default router;
