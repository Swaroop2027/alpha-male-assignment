import mongoose from "mongoose";

const landingPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, // e.g. 'alpha-bold' -> access at /lp/alpha-bold
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    headline: {
      type: String,
      required: true,
      default: "Unleash Your Peak Performance with Alpha Bold",
    },
    subheadline: {
      type: String,
      default: "Engineered for Drive, Stamina, and Unstoppable Energy",
    },
    bannerImage: {
      type: String,
      required: true,
    },
    offerText: {
      type: String,
      default: "Special Launch Offer: Flat 20% OFF + Free Express Shipping",
    },
    benefits: [
      {
        icon: { type: String, default: "Zap" },
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    ingredients: [
      {
        name: { type: String, required: true },
        potency: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    testimonials: [
      {
        customerName: { type: String, required: true },
        rating: { type: Number, default: 5 },
        review: { type: String, required: true },
        isSample: { type: Boolean, default: true }, // Assignment requirement: marked as sample
      },
    ],
    ctaButtonText: {
      type: String,
      default: "Order Now - Cash on Delivery Available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const LandingPage = mongoose.model("LandingPage", landingPageSchema);
export default LandingPage;
