import express from "express";
import {
  getDashboardAnalytics,
  getCustomersList,
  getCustomer360Profile,
  createLead,
  getLeads,
  updateLeadStatus,
  captureAbandonedCart,
  getAbandonedCarts,
  exportDataAsCsv,
} from "../controllers/crmController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public Action Endpoints
router.post("/leads", createLead);
router.post("/abandoned-carts/capture", captureAbandonedCart);

// Protected Analytics & CRM Routes
router.use(protect);

// Dashboard Analytics (Admin & Operations)
router.get(
  "/analytics/dashboard",
  authorize("Admin", "Operations"),
  getDashboardAnalytics,
);

// Customer 360 & Segments (Admin & Sales/Support)
router.get("/customers", authorize("Admin", "Sales/Support"), getCustomersList);
router.get(
  "/customers/:phone",
  authorize("Admin", "Sales/Support"),
  getCustomer360Profile,
);

// Leads Pipeline
router.get("/leads", authorize("Admin", "Sales/Support"), getLeads);
router.patch(
  "/leads/:id",
  authorize("Admin", "Sales/Support"),
  updateLeadStatus,
);

// Abandoned Carts
router.get(
  "/abandoned-carts",
  authorize("Admin", "Sales/Support"),
  getAbandonedCarts,
);

// CSV Export (Admin, Operations, Sales/Support)
router.get(
  "/export/:type",
  authorize("Admin", "Operations", "Sales/Support"),
  exportDataAsCsv,
);

export default router;
