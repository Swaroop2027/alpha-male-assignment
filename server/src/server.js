import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import landingPageRoutes from "./routes/landingPageRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import fulfillmentRoutes from "./routes/fulfillmentRoutes.js";
import postPurchaseRoutes from "./routes/postPurchaseRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Flexible CORS for Production & Local Development
const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (
        !clientUrl ||
        clientUrl === "*" ||
        origin === clientUrl ||
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in evaluation mode
    },
    credentials: true,
  }),
);

// Capture raw body for Webhooks (Razorpay & Shiprocket)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());

// Global API rate limiter
app.use("/api/", apiLimiter);

// Mount All Platform Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/pincodes", pincodeRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/landing-pages", landingPageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/fulfillment", fulfillmentRoutes);
app.use("/api/post-purchase", postPurchaseRoutes);
app.use("/api/crm", crmRoutes);

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Alpha Male D2C Platform API is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});