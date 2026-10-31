import express from "express";
import {
  getOrdersList,
  getOrderDetails,
  updateOrderStatus,
  addInternalNote,
  downloadGstInvoice,
  downloadShippingLabel,
  bulkMarkPacked,
  bulkPrintInvoices,
  bulkPrintLabels,
  getPicklist,
  bookCourier,
  courierWebhook,
} from "../controllers/fulfillmentController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public Webhook for Courier Tracking updates
router.post("/webhook/courier", courierWebhook);

// Public PDF View / Download links
router.get("/orders/:id/invoice-pdf", downloadGstInvoice);
router.get("/orders/:id/shipping-label-pdf", downloadShippingLabel);

// Protected Operations & Admin Endpoints (RBAC Enforced)
router.use(protect);

router.get("/orders", authorize("Admin", "Operations"), getOrdersList);
router.get(
  "/orders/:id",
  authorize("Admin", "Operations", "Sales/Support"),
  getOrderDetails,
);
router.patch(
  "/orders/:id/status",
  authorize("Admin", "Operations"),
  updateOrderStatus,
);
router.post(
  "/orders/:id/notes",
  authorize("Admin", "Operations", "Sales/Support"),
  addInternalNote,
);
router.post(
  "/orders/:id/book-courier",
  authorize("Admin", "Operations"),
  bookCourier,
);

// Bulk Operations
router.post("/bulk/pack", authorize("Admin", "Operations"), bulkMarkPacked);
router.post(
  "/bulk/print-invoices",
  authorize("Admin", "Operations"),
  bulkPrintInvoices,
);
router.post(
  "/bulk/print-labels",
  authorize("Admin", "Operations"),
  bulkPrintLabels,
);
router.post("/bulk/picklist", authorize("Admin", "Operations"), getPicklist);

export default router;
