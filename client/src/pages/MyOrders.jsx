import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  FileText,
  Truck,
  Loader2,
} from "lucide-react";
import api, { API_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/my-orders");
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Order History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">{user?.name}</strong> (
            {user?.phone})
          </p>
        </div>

        <Link
          to="/"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition"
        >
          Explore Catalog
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">
            No Orders Placed Yet
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Start your male optimization journey today.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block px-5 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-bold text-sky-400">
                    #{order.orderId}
                  </span>
                  <span className="text-xs text-slate-500 ml-3">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      order.orderStatus === "Delivered"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : order.orderStatus === "Shipped"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                  <span className="text-xs font-bold text-white">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-xs text-slate-300"
                  >
                    <span>
                      • {it.title} (x{it.quantity})
                    </span>
                    <span className="text-white font-semibold">
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-3">
                <a
                  href={`${API_BASE_URL}/api/fulfillment/orders/${order.orderId}/invoice-pdf${localStorage.getItem("alpha_token") ? `?token=${encodeURIComponent(localStorage.getItem("alpha_token"))}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-sky-400 font-semibold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>GST Tax Invoice</span>
                </a>

                <Link
                  to={`/order-confirmation/${order.orderId}`}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Tracking & Actions</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;