import Product from "../models/Product.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// Helper to ensure Alpha Boss has working image URLs even before DB re-seed
const sanitizeProductImage = (prod) => {
  const p = prod?.toObject ? prod.toObject() : { ...prod };
  if (p && p.slug === "alpha-boss") {
    if (
      !p.images ||
      p.images.length === 0 ||
      p.images.some((img) => /photo-1550572017|photo-1584017911766/.test(img))
    ) {
      p.images = [
        "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80",
        "https://images.unsplash.com/photo-1633171031508-a8f26271e8aa?w=800&q=80",
      ];
    }
  }
  return p;
};

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
    const sanitizedProducts = products.map(sanitizeProductImage);

    return sendResponse(res, 200, "Products retrieved successfully", {
      count: sanitizedProducts.length,
      products: sanitizedProducts,
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

    const sanitizedProduct = sanitizeProductImage(product);

    return sendResponse(res, 200, "Product details retrieved", { product: sanitizedProduct });
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
