import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);

export default router;
