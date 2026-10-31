import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "alpha_male_super_secret_jwt_key_2026",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

// @desc    Register a Customer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      throw new ApiError(
        "Please provide name, email, phone, and password.",
        400,
      );
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError("An account with this email already exists.", 400);
    }

    // New registrations are always 'Customer' role for security
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "Customer",
      firstUtmSource: req.body.utmSource || "Organic",
    });

    const token = generateToken(user._id);

    return sendResponse(res, 201, "User registered successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login for Admin, Staff & Customer
// @route   POST /api/auth/login
// @access  Public (Rate limited)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError("Please provide email and password.", 400);
    }

    // Select password explicitly since select: false in schema
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError("Invalid email or password.", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new ApiError(
        "Account has been deactivated. Please contact support.",
        403,
      );
    }

    const token = generateToken(user._id);

    return sendResponse(res, 200, "Login successful", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Logged-in User Profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendResponse(res, 200, "Current user profile retrieved", { user });
  } catch (error) {
    next(error);
  }
};
