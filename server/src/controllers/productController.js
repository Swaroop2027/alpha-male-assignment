import Product from "../models/Product.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// @desc    Get all active products with search, filter, and sorting
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { search, sort, inStock } = req.query;
    const query = { isActive: true };

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by stock
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };
    else if (sort === "rating") sortOption = { stock: -1 };

    const products = await Product.find(query).sort(sortOption);

    return sendResponse(res, 200, "Products retrieved successfully", {
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by slug (or ID)
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Support lookup by slug or MongoDB ObjectId
    const query = slug.match(/^[0-9a-fA-F]{24}$/) ? { _id: slug } : { slug };
    const product = await Product.findOne(query);

    if (!product) {
      throw new ApiError(`Product not found with slug/id: ${slug}`, 404);
    }

    return sendResponse(res, 200, "Product details retrieved", { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin Only)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { title, slug, mrp, price, stock, hsnCode, description, images } =
      req.body;

    if (!title || !slug || !mrp || !price || stock === undefined) {
      throw new ApiError(
        "Please provide title, slug, mrp, selling price and stock",
        400,
      );
    }

    const existing = await Product.findOne({ slug });
    if (existing) {
      throw new ApiError(`Product with slug '${slug}' already exists`, 400);
    }

    const product = await Product.create(req.body);
    return sendResponse(res, 201, "Product created successfully", { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details or stock (Admin Only)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    return sendResponse(res, 200, "Product updated successfully", { product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate product (Admin Only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    return sendResponse(res, 200, "Product deactivated successfully");
  } catch (error) {
    next(error);
  }
};
