import express from "express";
import {
  checkPincode,
  getAllPincodes,
  addPincode,
} from "../controllers/pincodeController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public check for product page and checkout form
router.get("/check/:pincode", checkPincode);

// Admin & Operations management
router.get("/", protect, authorize("Admin", "Operations"), getAllPincodes);
router.post("/", protect, authorize("Admin", "Operations"), addPincode);

export default router;
