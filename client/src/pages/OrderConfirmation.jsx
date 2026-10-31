import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Truck,
  Loader2
} from 'lucide-react';
import api, { API_BASE_URL } from '../api/axios';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/lookup/${orderId}`);
      setOrder(res.data.data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm COD Order Step (Module 3 Must-Have 5 & 6)
  const handleConfirmCod = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${orderId}/confirm-cod`);
      setOrder(res.data.data.order);
      setMessage('✓ Cash on Delivery Order has been confirmed and queued for packing!');
    } catch (err) {
      setMessage(err.message || 'Failed to confirm COD order');
    } finally {
      setActionLoading(false);
    }
  };

  // Mock / Sandbox Razorpay Payment Completion
  const handleVerifyMockPayment = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/orders/verify-payment', {
        orderId: order.orderId,
        razorpay_order_id: order.razorpay?.orderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'sandbox_verified_signature'
      });
      setOrder(res.data.data.order);
      setMessage('✓ Payment verified successfully! Order marked as Paid.');
    } catch (err) {
      setMessage(err.message || 'Payment verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <Link to="/" className="mt-4 px-4 py-2 bg-sky-500 text-slate-950 font-bold rounded-lg text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'Paid';
  const isCodConfirmed = order.paymentMethod === 'COD' && order.codConfirmed;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center">
        {/* Status Icon */}
        <div className="mb-4 inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400">
          {isPaid || isCodConfirmed ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <Clock className="w-12 h-12 text-amber-400" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          {isPaid || isCodConfirmed ? 'Order Confirmed!' : 'Order Placed (Action Required)'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Order ID: <span className="font-bold text-sky-400">{order.orderId}</span>
          {order.invoiceNumber && <span> • Invoice: <strong className="text-white">{order.invoiceNumber}</strong></span>}
        </p>

        {message && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-xs rounded-xl">
            {message}
          </div>
        )}

        {/* COD Confirmation Card */}
        {order.paymentMethod === 'COD' && !order.codConfirmed && (
          <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Confirm Your Cash on Delivery Order</span>
            </div>
            <p className="text-xs text-slate-300">
              To minimize returned packages (RTO), we require one-click confirmation before warehouse packing.
            </p>
            <button
              onClick={handleConfirmCod}
              disabled={actionLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONFIRM COD DISPATCH'}
            </button>
          </div>
        )}

        {/* Prepaid Pending Test Payment Step */}
        {order.paymentMethod === 'Prepaid' && order.paymentStatus !== 'Paid' && (
          <div className="mt-6 p-5 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Complete Payment in Sandbox Mode</span>
            </div>
            <p className="text-xs text-slate-300">
              Razorpay Test Order: <code className="text-sky-300">{order.razorpay?.orderId}</code>. Click below to verify signature and mark Paid.
            </p>
            <button
              onClick={handleVerifyMockPayment}
              disabled={actionLoading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Test Payment (Verify Signature)'}
            </button>
          </div>
        )}

        {/* Order Details Table */}
        <div className="mt-8 border-t border-slate-800 pt-6 text-left space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Formulations</h4>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="text-slate-400">Qty: {item.quantity} • HSN: {item.hsnCode}</p>
                </div>
                <span className="font-bold text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-3 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="text-white">₹{order.itemsSubtotal}</span>
            </div>
            {order.coupon?.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Discount ({order.coupon.code}):</span>
                <span>- ₹{order.coupon.discountAmount}</span>
              </div>
            )}
            {order.prepaidDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Prepaid Discount:</span>
                <span>- ₹{order.prepaidDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
              <span>Total Payable:</span>
              <span className="text-sky-400">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-3 justify-center">
          <a
            href={`${API_BASE_URL}/api/fulfillment/orders/${order.orderId}/invoice-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View GST Invoice PDF</span>
          </a>

          <Link
            to="/track"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Delivery</span>
          </Link>

          <Link
            to="/"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;