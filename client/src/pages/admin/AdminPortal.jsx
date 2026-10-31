import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import OrdersManagement from "./OrdersManagement";
import CrmWorkspace from "./CrmWorkspace";
import { LayoutDashboard, Package, Users } from "lucide-react";

const AdminPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === "Operations") return "orders";
    if (user?.role === "Sales/Support") return "crm";
    return "dashboard";
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Role Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-sky-500/20">
            Active Role: {user?.role || "Staff"}
          </span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
            Alpha Male Management Portal
          </h1>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex gap-2">
          {user?.role === "Admin" && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {(user?.role === "Admin" || user?.role === "Operations") && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders & Shipping</span>
            </button>
          )}

          {(user?.role === "Admin" || user?.role === "Sales/Support") && (
            <button
              onClick={() => setActiveTab("crm")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "crm"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>CRM & Leads</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === "dashboard" && <AdminDashboard />}
      {activeTab === "orders" && <OrdersManagement />}
      {activeTab === "crm" && <CrmWorkspace />}
    </div>
  );
};

export default AdminPortal;