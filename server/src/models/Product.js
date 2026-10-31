import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    tagline: { type: String, default: '' },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0
    },
    hsnCode: {
      type: String,
      default: '21069099' // Standard HSN code for health & wellness supplements
    },
    stock: {
      type: Number,
      required: true,
      default: 100,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 15
    },
    sku: { type: String, unique: true },
    weightGrams: { type: Number, default: 250 },
    benefits: [{ type: String }],
    ingredients: [{ type: String }],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;