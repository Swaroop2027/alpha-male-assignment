import Coupon from "../models/Coupon.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// @desc    Validate coupon code against cart amount
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      throw new ApiError("Please provide coupon code and cart total", 400);
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new ApiError("Invalid coupon code.", 404);
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      throw new ApiError("This coupon code has expired.", 400);
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError("Coupon usage limit reached.", 400);
    }

    // Check Minimum Order Value
    if (cartTotal < coupon.minOrderValue) {
      throw new ApiError(
        `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
        400,
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Flat discount
      discountAmount = coupon.discountValue;
    }

    // Prevent discount > cartTotal
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return sendResponse(
      res,
      200,
      `Coupon '${coupon.code}' applied successfully!`,
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalTotal: cartTotal - discountAmount,
      },
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, "Coupons retrieved", { coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiryDate } =
      req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      throw new ApiError("Missing required coupon parameters", 400);
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing)
      throw new ApiError("Coupon with this code already exists", 400);

    const coupon = await Coupon.create({
      ...req.body,
      code: code.toUpperCase(),
    });

    return sendResponse(res, 201, "Coupon created successfully", { coupon });
  } catch (error) {
    next(error);
  }
};
