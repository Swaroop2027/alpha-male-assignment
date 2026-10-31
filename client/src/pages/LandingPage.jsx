import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  Truck,
  Star,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '../api/axios';
import { useUtm } from '../hooks/useUtm';

const LandingPage = () => {
  const { slug } = useParams();
  const utm = useUtm();
  const navigate = useNavigate();
  const orderFormRef = useRef(null);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // One-Step Order Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    stateCode: '27',
    paymentMethod: 'Prepaid'
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [couponCode, setCouponCode] = useState('ALPHA20');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchLandingPage();
  }, [slug]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/landing-pages/${slug}`);
      setPageData(res.data.data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Fill City & State from Pincode (Module 2 Must-Have 4)
  const handlePincodeChange = async (pin) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        setPincodeLoading(true);
        setPincodeError('');
        const res = await api.get(`/pincodes/check/${cleanPin}`);
        if (res.data.data.serviceable) {
          setFormData((prev) => ({
            ...prev,
            city: res.data.data.city,
            state: res.data.data.state,
            stateCode: res.data.data.stateCode
          }));
        } else {
          setPincodeError('Pincode is not serviceable for delivery');
        }
      } catch (err) {
        setPincodeError('Invalid or unserviceable pincode');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Scroll smoothly to One-Step Order Form
  const scrollToOrderForm = () => {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Abandoned Cart Capture when phone is 10 digits
  const handlePhoneBlur = () => {
    if (formData.phone.length === 10 && pageData?.product) {
      api.post('/crm/abandoned-carts/capture', {
        phone: formData.phone,
        customerName: formData.name || 'Visitor',
        email: formData.email,
        items: [{
          product: pageData.product._id,
          title: pageData.product.title,
          price: pageData.product.price,
          quantity: 1,
          image: pageData.product.images?.[0]
        }],
        cartTotal: pageData.product.price,
        utm
      }).catch(() => {});
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.addressLine || !formData.pincode) {
      setFormError('Please fill in all required shipping fields');
      return;
    }
    if (formData.phone.length !== 10) {
      setFormError('Mobile number must be exactly 10 digits');
      return;
    }
    if (!formData.city || pincodeError) {
      setFormError('Please provide a valid, serviceable 6-digit pincode');
      return;
    }

    try {
      setOrderSubmitting(true);
      setFormError('');

      const orderPayload = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        },
        shippingAddress: {
          addressLine: formData.addressLine,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          stateCode: formData.stateCode,
          pincode: formData.pincode
        },
        items: [{
          productId: pageData.product._id,
          quantity: 1
        }],
        paymentMethod: formData.paymentMethod,
        couponCode: couponCode || null,
        utm
      };

      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data.data.order;

      navigate(`/order-confirmation/${createdOrder.orderId}`);
    } catch (err) {
      setFormError(err.message || 'Order placement failed');
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-xl font-bold text-white">Campaign Page Not Found</h2>
      </div>
    );
  }

  const { product } = pageData;
  const couponDiscountAmount = couponCode === 'ALPHA20' ? Math.round(product.price * 0.20) : 0;
  const discountedPrice = product.price - couponDiscountAmount;
  const estimatedPrepaid = Math.round(discountedPrice * 0.95);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Campaign Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-xs py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-lg">
        <Sparkles className="w-4 h-4" />
        <span>{pageData.offerText || 'SPECIAL CAMPAIGN OFFER: FLAT 20% OFF + FREE SHIPPING'}</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Headline & Offer Details */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-full">
                <Zap className="w-3.5 h-3.5" />
                <span>CLINICAL MALE VITALITY MATRIX</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                {pageData.headline}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {pageData.subheadline}
              </p>

              {/* Price Highlight */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl inline-flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">₹{product.price}</span>
                <span className="text-sm text-slate-500 line-through">₹{product.mrp}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-900">
                  Save ₹{product.mrp - product.price} Today
                </span>
              </div>

              {/* Instant CTA to Scroll to Form */}
              <div className="pt-2">
                <button
                  onClick={scrollToOrderForm}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-base transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 uppercase tracking-wider"
                >
                  <span>{pageData.ctaButtonText || 'Order Now - Cash on Delivery Available'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center lg:justify-start gap-3">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Ayurvedic</span>
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-sky-400" /> Free Discreet Delivery</span>
                </p>
              </div>
            </div>

            {/* Right: Banner Image */}
            <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
              <img
                src={pageData.bannerImage || product.images?.[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {pageData.benefits?.length > 0 && (
        <section className="py-14 border-b border-slate-800 bg-slate-900/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-black text-center text-white uppercase tracking-tight mb-8">
              Why Driven Men Choose <span className="text-sky-400">{product.title.split('-')[0]}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pageData.benefits.map((b, i) => (
                <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                  <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl mb-3">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{b.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ingredients Matrix */}
      {pageData.ingredients?.length > 0 && (
        <section className="py-14 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-black text-center text-white uppercase tracking-tight mb-8">
              Standardized Bio-Active Ingredients
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pageData.ingredients.map((ing, i) => (
                <div key={i} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {ing.potency}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-2">{ing.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{ing.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Testimonials (Marked as Sample - Assignment Requirement) */}
      {pageData.testimonials?.length > 0 && (
        <section className="py-14 border-b border-slate-800 bg-slate-900/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Real Results from Verified Men
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                (Testimonials below are marked as sample previews as per technical assignment specifications)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pageData.testimonials.map((t, i) => (
                <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 mb-2">
                      {Array.from({ length: t.rating || 5 }).map((_, r) => (
                        <Star key={r} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                      "{t.review}"
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{t.customerName}</span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Sample Marked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ONE-STEP INLINE ORDER FORM (Module 1 Must-Have 1) */}
      <section ref={orderFormRef} className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-sky-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Fast 1-Step Checkout
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight text-center">
              Enter Delivery Details
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1">
              No registration or password needed. Cash on Delivery available.
            </p>

            {formError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Aman Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">10-Digit Mobile *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    onBlur={handlePhoneBlur}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email for Tracking Updates (Optional)</label>
                <input
                  type="email"
                  placeholder="aman@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address / House No. *</label>
                <input
                  type="text"
                  placeholder="Flat 402, Building A, MG Road"
                  value={formData.addressLine}
                  onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Pincode & Auto-Filled City/State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Pincode *</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="400069"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                    {pincodeLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 absolute right-3 top-3" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City (Auto-filled)</label>
                  <input
                    type="text"
                    value={formData.city}
                    readOnly
                    placeholder="Auto-detected"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    readOnly
                    placeholder="Auto-detected"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>
              {pincodeError && <p className="text-[11px] text-rose-400">{pincodeError}</p>}

              {/* Coupon Box in Landing Page Form */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ALPHA20"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-sky-500"
                  />
                  {couponCode === 'ALPHA20' && (
                    <span className="inline-flex items-center px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl whitespace-nowrap">
                      -20% Applied
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                      formData.paymentMethod === 'Prepaid'
                        ? 'bg-sky-500/10 border-sky-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'Prepaid'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'Prepaid' })}
                        className="text-sky-500"
                      />
                      <span className="text-xs font-bold">Online Prepaid</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1">Extra 5% Discount applied!</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                      formData.paymentMethod === 'COD'
                        ? 'bg-sky-500/10 border-sky-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                        className="text-sky-500"
                      />
                      <span className="text-xs font-bold">Cash on Delivery</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Pay cash to courier</span>
                  </label>
                </div>
              </div>

              {/* Order Total & Submit */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-400">Total Payable Amount:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      ₹{formData.paymentMethod === 'Prepaid' ? estimatedPrepaid : discountedPrice}
                    </span>
                    <span className="block text-[10px] text-emerald-400">Free Express Delivery Included</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-base transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50"
                >
                  {orderSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing Order...
                    </>
                  ) : (
                    <span>CONFIRM & PLACE ORDER NOW</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {pageData.faqs?.length > 0 && (
        <section className="py-12 border-t border-slate-800 max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {pageData.faqs.map((faq, i) => (
              <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-xs sm:text-sm font-bold text-white">{faq.question}</h4>
                <p className="text-xs text-slate-400 mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STICKY "BUY NOW" BOTTOM BAR (Module 1 Must-Have 1) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 sm:px-8 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-xs font-bold text-white block sm:inline">{product.title.split('-')[0]}</span>
          <span className="text-base sm:text-lg font-black text-amber-400 sm:ml-3">₹{product.price}</span>
          <span className="text-[10px] text-slate-500 line-through ml-1.5">₹{product.mrp}</span>
        </div>

        <button
          onClick={scrollToOrderForm}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
        >
          <span>BUY NOW (COD AVAILABLE)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
