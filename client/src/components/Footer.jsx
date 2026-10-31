import React from "react";
import { ShieldCheck, Truck, RotateCcw, Award } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 mt-20">
      {/* Brand Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-bold text-white">
              100% Clinical Potency
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ayurvedic, Non-GMO & FSSAI certified
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl mb-2">
              <Truck className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-bold text-white">
              Free Express Delivery
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Discreet packaging across 20,000+ pins
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-bold text-white">Cash on Delivery</h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pay only when parcel reaches your doorstep
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl mb-2">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-bold text-white">
              7-Day Hassle-Free Return
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Easy refund process on delivered orders
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          <p>
            © {new Date().getFullYear()} Alpha Male D2C Private Limited. All
            rights reserved.
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Plot 42, Andheri East, Mumbai, Maharashtra 400069 | GSTIN:
            27AABCA1234F1Z8
          </p>
        </div>
        <div className="flex items-center gap-6">
          <a href="/track" className="hover:text-slate-300 transition">
            Track Shipment
          </a>
          <a href="/lp/alpha-bold" className="hover:text-slate-300 transition">
            Alpha Bold Launch
          </a>
          <a href="/login" className="hover:text-slate-300 transition">
            Operations Portal
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
