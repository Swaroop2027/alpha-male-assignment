import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  MapPin,
  ChevronRight,
  Loader2,
} from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("benefits");

  // Pincode Serviceability State
  const [pincode, setPincode] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinResult, setPinResult] = useState(null);

  // Reviews State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    averageRating: 5,
  });
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    rating: 5,
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${slug}`);
      const prod = res.data.data.product;
      setProduct(prod);
      setSelectedImage(prod.images?.[0] || "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80");
      fetchReviews(prod._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const res = await api.get(`/post-purchase/reviews/product/${productId}`);
      setReviewsData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckPincode = async (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    try {
      setPinLoading(true);
      setPinResult(null);
      const res = await api.get(`/pincodes/check/${pincode}`);
      setPinResult(res.data.data);
    } catch {
      setPinResult({ serviceable: false, message: "Unable to verify pincode" });
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.customerName || !reviewForm.comment) return;

    try {
      setReviewSubmitting(true);
      const res = await api.post("/post-purchase/reviews", {
        productId: product._id,
        ...reviewForm,
      });
      setReviewMessage(res.data.message);
      setReviewForm({ customerName: "", rating: 5, comment: "" });
    } catch {
      setReviewMessage("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-sky-500 text-slate-950 font-bold rounded-lg text-sm"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const discountPercent = Math.round(
    ((product.mrp - product.price) / product.mrp) * 100,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link to="/" className="hover:text-white">
          Storefront
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <img
              src={selectedImage}
              alt={product.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80";
              }}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    selectedImage === img
                      ? "border-sky-500"
                      : "border-slate-800 opacity-60"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80";
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="font-bold text-sm">
                {reviewsData.averageRating}
              </span>
              <span className="text-slate-500">
                ({reviewsData.count} verified customer reviews)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {product.title}
            </h1>

            <p className="text-xs text-sky-400 font-semibold mt-1">
              {product.tagline ||
                "100% Pure Standardized Ayurvedic Formulation"}
            </p>

            {/* Price Box */}
            <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                ₹{product.price}
              </span>
              <span className="text-sm text-slate-500 line-through">
                ₹{product.mrp}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-full">
                Save ₹{product.mrp - product.price} ({discountPercent}% OFF)
              </span>
            </div>

            {/* Pincode Serviceability Check (Module 2 Must-Have 5) */}
            <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Check Delivery & COD Availability</span>
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode (e.g. 400069)"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(e.target.value.replace(/\D/g, ""))
                  }
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={pinLoading || pincode.length !== 6}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {pinLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </button>
              </form>

              {pinResult && (
                <div
                  className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    pinResult.serviceable
                      ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-300"
                      : "bg-rose-950/40 border border-rose-900/60 text-rose-300"
                  }`}
                >
                  {pinResult.serviceable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div>
                        <p className="font-bold">
                          {pinResult.deliveryEstimate}
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          To {pinResult.city}, {pinResult.state} • Cash on
                          Delivery Available
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{pinResult.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quantity Selector & Add To Cart Button */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center justify-between border border-slate-700 rounded-xl bg-slate-900 px-3 py-2 sm:w-36">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-sky-400 text-slate-400"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:text-sky-400 text-slate-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => addToCart(product, quantity)}
                className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99]"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Add To Cart - ₹{product.price * quantity}</span>
              </button>
            </div>
          </div>

          {/* Quick Assurance Tags */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-400">
            <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <span>100% Ayurvedic</span>
            </div>
            <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <Truck className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <span>Free Delivery</span>
            </div>
            <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <RotateCcw className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <span>7-Day Return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Benefits, Ingredients, FAQs & Reviews */}
      <div className="mt-16 pt-8 border-t border-slate-800">
        <div className="flex border-b border-slate-800 gap-4 sm:gap-8 overflow-x-auto">
          {["benefits", "ingredients", "faqs", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="py-8 max-w-4xl">
          {activeTab === "benefits" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                Clinical Benefits
              </h3>
              <p className="text-sm text-slate-400">{product.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {product.benefits?.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 font-medium">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ingredients" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                Active Formulations
              </h3>
              <div className="space-y-2">
                {product.ingredients?.map((ing, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300"
                  >
                    • {ing}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "faqs" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {product.faqs?.map((faq, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-900/60 rounded-xl border border-slate-800"
                  >
                    <h4 className="text-sm font-bold text-white">
                      {faq.question}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Submit Review Form */}
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
                <h4 className="text-base font-bold text-white mb-2">
                  Write a Verified Review
                </h4>
                {reviewMessage ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs rounded-lg">
                    {reviewMessage}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kunal D."
                        value={reviewForm.customerName}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Rating (1 to 5 Stars)
                      </label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            rating: Number(e.target.value),
                          })
                        }
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 - Outstanding)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                        <option value={3}>⭐⭐⭐ (3 - Average)</option>
                        <option value={2}>⭐⭐ (2 - Poor)</option>
                        <option value={1}>⭐ (1 - Terrible)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Your Feedback / Review
                      </label>
                      <textarea
                        rows={3}
                        placeholder="How did this formulation impact your workouts or daily stamina?"
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Customer Feedback
                </h4>
                {reviewsData.reviews.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Be the first to review this product!
                  </p>
                ) : (
                  reviewsData.reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white">
                          {rev.customerName}
                        </span>
                        <div className="flex text-amber-400 text-xs">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
