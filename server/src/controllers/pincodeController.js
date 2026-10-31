import Pincode from "../models/Pincode.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// Helper to format delivery date string (e.g., "Friday, 31 Oct")
const getDeliveryDateString = (daysToAdd) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (daysToAdd || 3));

  const options = { weekday: "long", day: "numeric", month: "short" };
  return targetDate.toLocaleDateString("en-IN", options);
};

// @desc    Check pincode serviceability & get city/state auto-fill
// @route   GET /api/pincodes/check/:pincode
// @access  Public
export const checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      throw new ApiError("Please provide a valid 6-digit Indian pincode", 400);
    }

    const foundPincode = await Pincode.findOne({ pincode });

    if (!foundPincode || !foundPincode.isServiceable) {
      return sendResponse(res, 200, "Pincode not serviceable", {
        serviceable: false,
        pincode,
        message: `Delivery is currently not available to pincode ${pincode}`,
      });
    }

    const deliveryEstimate = getDeliveryDateString(foundPincode.deliveryDays);

    return sendResponse(res, 200, "Pincode is serviceable", {
      serviceable: true,
      pincode: foundPincode.pincode,
      city: foundPincode.city,
      state: foundPincode.state,
      stateCode: foundPincode.stateCode,
      codAvailable: foundPincode.codAvailable,
      deliveryDays: foundPincode.deliveryDays,
      deliveryEstimate: `Delivery by ${deliveryEstimate}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pincodes / Add new pincode (Admin/Operations)
// @route   GET /api/pincodes | POST /api/pincodes
export const getAllPincodes = async (req, res, next) => {
  try {
    const pincodes = await Pincode.find().sort({ pincode: 1 });
    return sendResponse(res, 200, "Pincodes retrieved", { pincodes });
  } catch (error) {
    next(error);
  }
};

export const addPincode = async (req, res, next) => {
  try {
    const { pincode, city, state, stateCode, deliveryDays } = req.body;
    const exists = await Pincode.findOne({ pincode });
    if (exists) throw new ApiError("Pincode already registered", 400);

    const newPin = await Pincode.create({
      pincode,
      city,
      state,
      stateCode,
      deliveryDays: deliveryDays || 3,
    });

    return sendResponse(res, 201, "Pincode added successfully", {
      pincode: newPin,
    });
  } catch (error) {
    next(error);
  }
};
