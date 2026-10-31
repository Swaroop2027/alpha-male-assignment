import express from "express";
import {
  getLandingPageBySlug,
  getAllLandingPages,
  createLandingPage,
  updateLandingPage,
} from "../controllers/landingPageController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/:slug", getLandingPageBySlug);

// Admin-only management
router.get("/", protect, authorize("Admin"), getAllLandingPages);
router.post("/", protect, authorize("Admin"), createLandingPage);
router.put("/:id", protect, authorize("Admin"), updateLandingPage);

export default router;
