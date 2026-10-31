import LandingPage from "../models/LandingPage.js";
import Product from "../models/Product.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// @desc    Get dynamic landing page by slug
// @route   GET /api/landing-pages/:slug
// @access  Public
export const getLandingPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const page = await LandingPage.findOne({ slug, isActive: true }).populate(
      "product",
      "title slug price mrp stock images hsnCode",
    );

    if (!page) {
      throw new ApiError(`Landing page not found for slug: ${slug}`, 404);
    }

    return sendResponse(res, 200, "Landing page configuration retrieved", {
      page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all landing pages (Admin)
// @route   GET /api/landing-pages
// @access  Private/Admin
export const getAllLandingPages = async (req, res, next) => {
  try {
    const pages = await LandingPage.find()
      .populate("product", "title slug price")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, "Landing pages retrieved", { pages });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Publish new dynamic landing page (Admin)
// @route   POST /api/landing-pages
// @access  Private/Admin
export const createLandingPage = async (req, res, next) => {
  try {
    const { slug, product, headline, bannerImage } = req.body;

    if (!slug || !product || !headline || !bannerImage) {
      throw new ApiError(
        "Please provide slug, product, headline, and banner image",
        400,
      );
    }

    const existing = await LandingPage.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      throw new ApiError(
        `Landing page with slug '${slug}' already exists`,
        400,
      );
    }

    const page = await LandingPage.create({
      ...req.body,
      slug: slug.toLowerCase(),
    });

    return sendResponse(res, 201, "Landing page published successfully", {
      page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update landing page (Admin)
// @route   PUT /api/landing-pages/:id
// @access  Private/Admin
export const updateLandingPage = async (req, res, next) => {
  try {
    const page = await LandingPage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!page) throw new ApiError("Landing page not found", 404);

    return sendResponse(res, 200, "Landing page updated successfully", {
      page,
    });
  } catch (error) {
    next(error);
  }
};
