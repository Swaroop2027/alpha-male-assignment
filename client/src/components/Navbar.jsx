import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, PhoneCall, Shield, User, LogOut, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CallbackModal from './CallbackModal';

const Navbar = () => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white text-[11px] font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span>⚡ SPECIAL LAUNCH: Flat 20% OFF using code <strong>ALPHA20</strong> + Cash on Delivery Available</span>
      </div>

      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/25">
              α
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">ALPHA MALE</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-sky-400 uppercase tracking-widest border-l border-slate-700 pl-2">
                Drive • Stamina
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition">
              Products
            </Link>
            <Link to="/lp/alpha-bold" className="text-sm font-medium text-amber-400 hover:text-amber-300 transition flex items-center gap-1">
              <span>🔥 Alpha Bold Campaign</span>
            </Link>
            <Link to="/track" className="text-sm font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Track Order</span>
            </Link>
            <button
              onClick={() => setIsCallbackOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-900 border border-slate-700 text-sky-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Request Callback</span>
            </button>
          </div>

          {/* Right Actions (Cart, Portal/Auth) */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl transition"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5 text-sky-400" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Portal / Admin Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user?.role === 'Customer' ? '/my-orders' : '/admin'}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>{user?.role === 'Customer' ? 'My Orders' : 'Portal'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Products Catalog
            </Link>
            <Link
              to="/lp/alpha-bold"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-amber-400"
            >
              🔥 Alpha Bold Campaign Landing Page
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300"
            >
              Track Order Status
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsCallbackOpen(true);
              }}
              className="w-full text-left py-2 text-xs font-semibold text-sky-400 flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Request An Expert Callback</span>
            </button>
          </div>
        )}
      </nav>

      {/* Callback Modal */}
      <CallbackModal isOpen={isCallbackOpen} onClose={() => setIsCallbackOpen(false)} />
    </>
  );
};

export default Navbar;
