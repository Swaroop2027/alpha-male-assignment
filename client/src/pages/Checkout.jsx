import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  AlertCircle,
  Tag,
  Loader2,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Percent,
  X
} from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUtm } from '../hooks/useUtm';

const DEFAULT_ACTIVE_COUPONS = [
  {
    code: 'POWER10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    maxDiscountAmount: 300,
    description: 'Get 10% OFF on regimens above ₹499'
  },
  {
    code: 'ALPHA20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 999,
    maxDiscountAmount: 500,
    description: 'Get 20% OFF up to ₹500 on orders above ₹999'
  },
  {
    code: 'FLAT300',
    discountType: 'flat',
    discountValue: 300,
    minOrderValue: 1499,
    maxDiscountAmount: null,
    description: 'Flat ₹300 OFF on premium orders above ₹1,499'
  }
];

const Checkout = () => {
  const { cart, cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const utm = useUtm();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    addressLine: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    stateCode: '27',
    paymentMethod: 'Prepaid'
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState(DEFAULT_ACTIVE_COUPONS);
  const [showCouponList, setShowCouponList] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Fetch active coupons from server on mount
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const res = await api.get('/coupons/active');
        if (res.data?.data?.coupons?.length > 0) {
          setAvailableCoupons(res.data.data.coupons);
        }
      } catch {
        // Fallback to DEFAULT_ACTIVE_COUPONS on network error
      }
    };
    fetchActiveCoupons();
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <ShoppingBag className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <Link to="/" className="mt-4 px-5 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-xl text-xs">
          Explore Products
        </Link>
      </div>
    );
  }

  // Auto-fill City & State from Pincode
  const handlePincodeChange = async (pin) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        setPincodeLoading(true);
        setPincodeStatus(null);
        const res = await api.get(`/pincodes/check/${cleanPin}`);
        if (res.data.data.serviceable) {
          setFormData((prev) => ({
            ...prev,
            city: res.data.data.city,
            state: res.data.data.state,
            stateCode: res.data.data.stateCode
          }));
          setPincodeStatus({ serviceable: true, estimate: res.data.data.deliveryEstimate });
        } else {
          setPincodeStatus({ serviceable: false, message: 'Pincode not serviceable' });
        }
      } catch {
        setPincodeStatus({ serviceable: false, message: 'Invalid pincode' });
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Abandoned Cart Capture when customer types 10-digit mobile
  const handlePhoneBlur = () => {
    if (formData.phone.length === 10) {
      api.post('/crm/abandoned-carts/capture', {
        phone: formData.phone,
        customerName: formData.name || 'Shopper',
        email: formData.email,
        items: cart,
        cartTotal: cartSubtotal,
        utm
      }).catch(() => {});
    }
  };

  // Server-side Coupon Code validation
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput) return;
    await applyCouponByCode(couponInput);
  };

  const applyCouponByCode = async (codeToApply) => {
    try {
      setCouponLoading(true);
      setCouponError('');
      setCouponInput(codeToApply.toUpperCase());
      const res = await api.post('/coupons/validate', {
        code: codeToApply.toUpperCase(),
        cartTotal: cartSubtotal
      });
      setAppliedCoupon(res.data.data);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  // Calculations
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const afterCouponTotal = Math.max(0, cartSubtotal - discountAmount);
  const prepaidDiscount = formData.paymentMethod === 'Prepaid' ? Math.round(afterCouponTotal * 0.05) : 0;
  const finalPayable = afterCouponTotal - prepaidDiscount;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.addressLine || !formData.pincode) {
      setCheckoutError('Please fill in all required shipping address fields');
      return;
    }
    if (formData.phone.length !== 10) {
      setCheckoutError('Mobile number must be exactly 10 digits');
      return;
    }
    if (!pincodeStatus?.serviceable) {
      setCheckoutError('Please provide a valid, serviceable Indian pincode');
      return;
    }

    // COD Limit check (Module 3 Must-Have 5)
    if (formData.paymentMethod === 'COD' && finalPayable > 3000) {
      setCheckoutError('Cash on Delivery is limited to orders up to ₹3,000. Please choose Prepaid to place this order.');
      return;
    }

    try {
      setSubmitting(true);
      setCheckoutError('');

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
        items: cart.map((it) => ({ productId: it.product, quantity: it.quantity })),
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code || null,
        utm
      };

      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data.data.order;

      clearCart();
      navigate(`/order-confirmation/${createdOrder.orderId}`);
    } catch (err) {
      setCheckoutError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-8">
        <Lock className="w-5 h-5 text-emerald-400" />
        <h1 className="text-2xl font-black text-white tracking-tight">Express Secure Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Customer & Address Form */}
        <div className="lg:col-span-7 space-y-6">
          {checkoutError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Customer Details */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">10-Digit Mobile *</label>
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email (for Tax Invoice & Tracking)</label>
              <input
                type="email"
                placeholder="vikram@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Delivery Address
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Flat / House No. / Building *</label>
              <input
                type="text"
                placeholder="Flat 302, Sunshine Heights"
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">6-Digit Pincode *</label>
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
                  {pincodeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 absolute right-3 top-3" />}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City (Auto-fill)</label>
                <input
                  type="text"
                  value={formData.city}
                  readOnly
                  placeholder="Auto-detected"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  readOnly
                  placeholder="Auto-detected"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>

            {pincodeStatus && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                pincodeStatus.serviceable
                  ? 'bg-emerald-950/40 border border-emerald-900 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-900 text-rose-300'
              }`}>
                {pincodeStatus.serviceable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{pincodeStatus.estimate} • Cash on Delivery Available</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{pincodeStatus.message}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Payment Selection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                  formData.paymentMethod === 'Prepaid'
                    ? 'bg-sky-500/10 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    checked={formData.paymentMethod === 'Prepaid'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'Prepaid' })}
                  />
                  <span className="text-xs font-bold">Online Prepaid (Cards / UPI)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold mt-2">Extra 5% OFF (Save ₹{prepaidDiscount})</span>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                  formData.paymentMethod === 'COD'
                    ? 'bg-sky-500/10 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                  />
                  <span className="text-xs font-bold">Cash on Delivery (COD)</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">
                  {finalPayable > 3000 ? '❌ Not available above ₹3,000' : 'Pay cash upon arrival'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Cart Summary & Dynamic Coupon Engine */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Order Summary ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product} className="flex gap-3 items-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80';
                    }}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {appliedCoupon ? (
                // Applied Coupon Card
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-300 font-mono tracking-wider">{appliedCoupon.code}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black tracking-wide">
                          APPLIED
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        🎉 Saving ₹{appliedCoupon.discountAmount} on this order
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Coupon Input Form
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Enter Coupon (e.g. ALPHA20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase tracking-wider focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Available Coupons Accordion & Cards */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponList(!showCouponList)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition py-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Available Offers & Coupons</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                      {availableCoupons.length}
                    </span>
                  </div>
                  {showCouponList ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showCouponList && (
                  <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {availableCoupons.map((coupon) => {
                      const isApplied = appliedCoupon?.code === coupon.code;
                      const isEligible = cartSubtotal >= coupon.minOrderValue;
                      const saving =
                        coupon.discountType === 'percentage'
                          ? Math.min(
                              coupon.maxDiscountAmount || Infinity,
                              Math.round((cartSubtotal * coupon.discountValue) / 100)
                            )
                          : coupon.discountValue;

                      return (
                        <div
                          key={coupon.code}
                          className={`p-3 rounded-xl border transition-all ${
                            isApplied
                              ? 'bg-emerald-950/20 border-emerald-500/50'
                              : isEligible
                              ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                              : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs px-2 py-0.5 rounded border border-dashed border-sky-400/60 bg-sky-950/40 text-sky-300 tracking-wider">
                                  {coupon.code}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} OFF`}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {coupon.discountType === 'percentage' && coupon.maxDiscountAmount
                                  ? `Save up to ₹${coupon.maxDiscountAmount} on orders above ₹${coupon.minOrderValue}`
                                  : `Flat ₹${coupon.discountValue} off on orders above ₹${coupon.minOrderValue}`}
                              </p>
                            </div>

                            {/* Action Button / Status */}
                            <div>
                              {isApplied ? (
                                <span className="text-[10px] font-black text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> APPLIED
                                </span>
                              ) : isEligible ? (
                                <button
                                  type="button"
                                  onClick={() => applyCouponByCode(coupon.code)}
                                  disabled={couponLoading}
                                  className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-lg transition active:scale-95 disabled:opacity-50"
                                >
                                  Apply
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                                  Min ₹{coupon.minOrderValue}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Progress / Hint */}
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            {isEligible ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                {isApplied
                                  ? `Applied discount: ₹${appliedCoupon.discountAmount}`
                                  : `Applicable now • Saves ₹${saving}`}
                              </span>
                            ) : (
                              <span className="text-amber-400/90 font-medium">
                                Add ₹{coupon.minOrderValue - cartSubtotal} more to unlock
                              </span>
                            )}

                            {isApplied && (
                              <button
                                type="button"
                                onClick={handleRemoveCoupon}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>- ₹{appliedCoupon.discountAmount}</span>
                </div>
              )}
              {prepaidDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Prepaid Incentive (5%)</span>
                  <span>- ₹{prepaidDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Shipping & Handling</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-2xl font-black text-white">₹{finalPayable}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                </>
              ) : (
                <span>COMPLETE ORDER - ₹{finalPayable}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
