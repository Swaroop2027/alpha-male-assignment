import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// Admin-only endpoints (Strict RBAC - Sales/Support forbidden)
router.post("/", protect, authorize("Admin"), createProduct);
router.put("/:id", protect, authorize("Admin"), updateProduct);
router.delete("/:id", protect, authorize("Admin"), deleteProduct);

export default router;
