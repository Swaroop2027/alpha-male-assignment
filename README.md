# Alpha Male - Mini D2C Commerce Platform

An end-to-end, full-stack D2C (Direct-to-Consumer) e-commerce system built for **Alpha Male** (men's performance nutrition brand) following the complete 6-module technical assessment specification on the modern **MERN Stack** (MongoDB, Express, React, Node.js) with ES6 JavaScript.

---

## 🚀 Live Flow & Feature Summary

### Module 1: Campaign Landing Pages
- **Dynamic Campaign Slug**: Custom landing page at `/lp/alpha-bold` with dedicated headlines, formulation benefits, and bio-active ingredient matrices.
- **1-Step Inline Checkout**: Instant checkout embedded directly on the landing page — eliminates multi-step cart abandonment.
- **Sticky "Buy Now" CTA**: Fixed bottom bar allowing one-tap jump to the order form on mobile and desktop.
- **UTM Attribution Engine**: Automatically extracts `utm_source`, `utm_medium`, and `utm_campaign` from URL query parameters, persists them across visitor sessions, and binds attribution to customer profiles and orders.
- **Sample Customer Reviews**: Previews of customer experiences clearly marked as sample representations.

### Module 2: Storefront & Cart Experience
- **Catalog of 4 Core Formulations**: `Alpha Bold`, `Alpha Boss`, `Alpha Legend`, and `Alpha Icon` with high-resolution imagery, pricing, and stock status.
- **Live Pincode Serviceability**: Instant check verifying delivery coverage across 20,000+ Indian pincodes with estimated delivery times (e.g. `400069` serviceable, `999999` unserviceable).
- **Slide-Out Cart Drawer**: Smooth slide-over drawer with strict responsive constraints (no horizontal scrolling), real-time MRP savings calculation, and quantity steppers.
- **Guest Checkout (No Forced Sign-up)**: Customers checkout directly with a 10-digit mobile number and shipping address.
- **Automatic City & State Auto-Fill**: Entering a valid 6-digit postal code queries the database and populates City and State without manual typing.

### Module 3: Checkout, Pricing & Payment Security
- **Strict Server-Calculated Pricing**: Browser-sent prices and discounts are never trusted; item prices, GST, discounts, and totals are recomputed on the backend.
- **Coupon Code Engine**: Dynamic coupon validation (e.g. `ALPHA20` gives 20% off up to ₹500 on orders ≥ ₹999).
- **Prepaid Incentive**: Automatic 5% discount applied when selecting Online Prepaid to reduce RTO risk.
- **Cash on Delivery (COD) Rules**:
  - Hard limit of ₹3,000 maximum for COD orders.
  - One-click COD confirmation step required before dispatch to prevent false orders.
- **Razorpay Sandbox Integration**: Payment signature verification with anti-replay attack protection.
- **Atomic Concurrency Protection**: Stock reduction occurs strictly when an order is Paid or COD-Confirmed using atomic MongoDB `$inc` operators (`{ stock: { $gte: qty } }`) to prevent overselling.

### Module 4: Order Fulfillment & Shipping Operations
- **Live Operations Fulfillment Queue**: Filterable by status (`New`, `Confirmed`, `Packed`, `Shipped`, `Delivered`, `Cancelled`, `RTO`) and payment type.
- **Status Audit Trail**: Every status change records the staff member's name, role, timestamp, and optional transition note.
- **Official GST Tax Invoice (A4 PDF)**: Generated on-the-fly using `PDFKit` with seller GSTIN, buyer state code, CGST+SGST vs IGST split, HSN codes, and amount in words.
- **4×6" Thermal Shipping Label PDF**: Standard `[288, 432]` point layout with scannable barcode/AWB, COD amount badge, and return routing address.
- **Bulk Operations**: Bulk Mark as Packed, Bulk Download Invoices PDF, Bulk Download 4x6" Labels PDF, and Aggregated Warehouse Picklist.
- **Shiprocket Courier Integration**: Courier booking sandbox generating tracking numbers and mock AWB assignment.

### Module 5: Post-Purchase Customer Experience
- **Public Shipment Tracking (`/track`)**: Customers track delivery milestones using Order ID + 10-digit Mobile Number.
- **7-Day Return Window**: Customers can submit return/refund requests on delivered orders with reason and description.
- **Order Support Tickets**: Direct support ticket creation mapped to orders.
- **Customer Reviews**: Submission and display of 1–5 star ratings and reviews per product.

### Module 6: CRM, Retention & Customer 360
- **Customer 360 View**: Aggregated customer intelligence grouped by 10-digit phone number, tracking lifetime spend, total orders, first UTM source, and complete purchase timeline.
- **Callback Leads Pipeline**: Interactive lead pipeline (`New` ➔ `Contacted` ➔ `Interested` ➔ `Converted`) captured from the storefront callback modal.
- **Abandoned Cart Auto-Capture**: Fires automatically as soon as a visitor inputs a 10-digit mobile number, generating 1-click WhatsApp follow-up links with pre-filled promo codes.
- **Customer Segmentation**: Instant filters for High Spenders (₹5,000+), Repeat Buyers, COD with RTO, and Inactive Customers.
- **Management Analytics Dashboard**: Real-time KPI cards (Total Revenue, AOV, Prepaid vs COD %, RTO Rate, Low Stock Alerts, and Daily Trend Bar Chart) + Ad Campaign Revenue attribution.
- **CSV Data Export**: 1-click CSV export for Orders, Customers, and Leads.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, Tailwind CSS v3, React Router v7, Lucide Icons, Axios.
- **Backend**: Node.js (ES6 `import/export`), Express.js, MongoDB (Mongoose), PDFKit, JWT, bcryptjs, express-rate-limit.
- **Payments**: Razorpay Node SDK (Sandbox mode with mock fallback).
- **Logistics**: Shiprocket API integration (with sandbox mock generation).

---

## 📦 Project Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally at `mongodb://localhost:27017/alphamale` OR a MongoDB Atlas connection string.

### 1. Backend Setup
```bash
cd server
npm install
```

Configure your environment file:
```bash
# Verify or edit server/.env (see server/.env.example for reference)
PORT=5000
MONGO_URI=mongodb://localhost:27017/alphamale
JWT_SECRET=alpha_male_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
```

Seed the database with sample products, pincodes, coupons, and staff accounts:
```bash
npm run seed
```

Start the backend API server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Pre-Seeded Test Accounts

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@alphamale.co.in` | `Admin@123` | Full access: Analytics, Orders, CRM, PDFs, Picklists |
| **Operations** | `ops@alphamale.co.in` | `Ops@123` | Orders management, status updates, courier booking, PDFs |
| **Sales / Support** | `sales@alphamale.co.in` | `Sales@123` | CRM, Leads pipeline, Abandoned carts, Customer 360 |
| **Customer** | `customer@alphamale.co.in` | `Customer@123` | Customer storefront, order history, GST invoice download |

*(Note: The login page at `/login` also features 1-Click quick login buttons for instant reviewer evaluation without manual typing).*

---

## 🧪 Quick Evaluation Walkthrough

1. **Campaign Landing Page**:
   - Visit: `http://localhost:5173/lp/alpha-bold?utm_source=instagram&utm_campaign=bold_launch`
   - Observe the sticky "Buy Now" CTA, UTM capture, and 1-step inline order form with instant coupon apply (`ALPHA20`).
2. **Storefront & Pincode Check**:
   - Visit: `http://localhost:5173`
   - Click any product (e.g. *Alpha Boss*). Check pincode `400069` (Serviceable) vs `999999` (Unserviceable).
3. **Cart Drawer**:
   - Click "Add to Cart" or the top cart icon. Verify responsive layout, zero horizontal scroll, quantity stepper, and live MRP savings badge.
4. **Checkout Flow**:
   - Enter guest details (10-digit mobile). Notice city/state auto-population from pincode. Test COD limit (orders > ₹3,000 restrict COD).
5. **Post-Purchase & Tracking**:
   - On order confirmation, verify Sandbox Payment or COD Confirmation.
   - Track shipment at `http://localhost:5173/track` using Order ID and mobile number.
6. **Staff Management Portal**:
   - Visit `http://localhost:5173/login`, click 👑 **Admin**, and explore the live KPI Dashboard, Orders queue with GST Tax Invoice and 4×6" Thermal Label PDF downloads, and Customer 360 CRM workspace.

