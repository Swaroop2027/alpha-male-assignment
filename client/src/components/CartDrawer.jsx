import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    totalSavings,
    totalItemsCount
  } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={() => setIsCartOpen(false)} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">Your Cart ({totalItemsCount})</h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Alert Banner */}
        <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Yay! You've unlocked <strong>FREE Express Shipping</strong></span>
        </div>

        {/* Cart Items List (Strict overflow-x-hidden, no horizontal scroll!) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="p-4 bg-slate-800/50 rounded-full text-slate-500 mb-3">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-white">Your cart is empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Fuel your potential with our clinical performance formulations.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg transition"
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product}
                className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 w-full"
              >
                {/* Fixed Square Image */}
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80";
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right Details */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </h5>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xs font-black text-white">₹{item.price}</span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-[10px] text-slate-500 line-through">₹{item.mrp}</span>
                    )}
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center border border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity - 1)}
                        className="px-2 py-1 hover:text-sky-400 text-slate-400 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity + 1)}
                        className="px-2 py-1 hover:text-sky-400 text-slate-400 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
            {totalSavings > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/50">
                <span>Total MRP Savings</span>
                <span className="font-bold">₹{totalSavings}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Order Subtotal</span>
              <span className="text-xl font-black text-white">₹{cartSubtotal}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
