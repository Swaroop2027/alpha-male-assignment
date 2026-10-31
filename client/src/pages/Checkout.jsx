import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  AlertCircle,
  Tag,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUtm } from '../hooks/useUtm';

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

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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
      } catch (err) {
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
    e.preventDefault();
    if (!couponInput) return;

    try {
      setCouponLoading(true);
      setCouponError('');
      const res = await api.post('/coupons/validate', {
        code: couponInput,
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

        {/* Right Column: Cart Summary & Coupon */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Order Summary ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product} className="flex gap-3 items-center">
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Box */}
            <div className="pt-4 border-t border-slate-800">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. ALPHA20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </button>
              </form>

              {appliedCoupon && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-2">
                  ✓ Coupon {appliedCoupon.code} applied (-₹{appliedCoupon.discountAmount})
                </p>
              )}
              {couponError && <p className="text-[11px] text-rose-400 mt-2">{couponError}</p>}
            </div>

            {/* Total Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
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
