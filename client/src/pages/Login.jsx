import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1-Click Test Account Credentials
  const quickFill = (email, password) => {
    setFormData((prev) => ({
      ...prev,
      email,
      password,
    }));
    setIsRegister(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const res = await api.post(endpoint, formData);

      const { user, token } = res.data.data;
      login(user, token);

      // Route by role
      if (
        user.role === "Admin" ||
        user.role === "Operations" ||
        user.role === "Sales/Support"
      ) {
        navigate("/admin");
      } else {
        navigate("/my-orders");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-sky-500/25 mb-3">
          α
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">
          {isRegister ? "Create Customer Account" : "Alpha Male Portal Login"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Role-Based Access for Admin, Operations, Support & Customers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Role Fillers (Reviewer Convenience) */}
        <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick-Switch Test Accounts (Assignment Review)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickFill("admin@alphamale.co.in", "Admin@123")}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
            >
              <strong className="block text-white text-[11px]">👑 Admin</strong>
              <span className="text-[10px] text-slate-500 truncate block">
                All permissions
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickFill("ops@alphamale.co.in", "Ops@123")}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
            >
              <strong className="block text-white text-[11px]">
                📦 Operations
              </strong>
              <span className="text-[10px] text-slate-500 truncate block">
                Orders & Shipping
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickFill("sales@alphamale.co.in", "Sales@123")}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
            >
              <strong className="block text-white text-[11px]">
                💼 Sales/Support
              </strong>
              <span className="text-[10px] text-slate-500 truncate block">
                CRM & Tickets
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                quickFill("customer@alphamale.co.in", "Customer@123")
              }
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
            >
              <strong className="block text-white text-[11px]">
                👤 Customer
              </strong>
              <span className="text-[10px] text-slate-500 truncate block">
                Order History
              </span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    10-Digit Mobile
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : isRegister ? (
                "Register Customer Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-sky-400 hover:underline"
            >
              {isRegister
                ? "Already have an account? Sign In"
                : "Don't have an account? Register as Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;