import React, { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Percent,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/crm/analytics/dashboard");
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  const { metrics, dailyTrend, salesByCampaign, lowStockProducts } = analytics;

  return (
    <div className="space-y-8">
      {/* KPI Stat Cards (Module 6 Must-Have 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-2">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase">
            Total Revenue
          </span>
          <p className="text-2xl font-black text-white mt-1">
            ₹{metrics.totalRevenue}
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold">
            Across all campaigns
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-2">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase">
            Average Order Value (AOV)
          </span>
          <p className="text-2xl font-black text-white mt-1">₹{metrics.aov}</p>
          <span className="text-[10px] text-slate-400">
            {metrics.totalOrders} Total Orders
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-2">
            <Percent className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase">
            Prepaid vs COD Split
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {metrics.prepaidPercentage}%{" "}
            <span className="text-xs font-normal text-slate-400">
              / {metrics.codPercentage}%
            </span>
          </p>
          <span className="text-[10px] text-sky-400 font-semibold">
            {metrics.prepaidPercentage}% Prepaid Ratio
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl w-fit mb-2">
            <RotateCcw className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase">
            RTO & Repeat Rate
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {metrics.rtoRate}%{" "}
            <span className="text-xs font-normal text-slate-400">RTO</span>
          </p>
          <span className="text-[10px] text-purple-400 font-semibold">
            {metrics.repeatRate}% Repeat Buyers
          </span>
        </div>
      </div>

      {/* Low Stock Alerts (Module 6 Must-Have 8) */}
      {lowStockProducts?.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Low Inventory Alert ({lowStockProducts.length} items)
              </h4>
              <p className="text-[11px] text-slate-400">
                {lowStockProducts
                  .map((p) => `${p.title.split("-")[0]} (Stock: ${p.stock})`)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Revenue Trend (Pure Responsive Bar Chart) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Daily Revenue Trend
        </h3>

        <div className="h-44 flex items-end gap-2 pt-6 pb-2 overflow-x-auto">
          {dailyTrend?.map((day, idx) => {
            const heightPercent = Math.min(
              100,
              Math.max(
                15,
                Math.round((day.revenue / (metrics.totalRevenue || 1)) * 300),
              ),
            );

            return (
              <div
                key={idx}
                className="flex-1 min-w-[40px] flex flex-col items-center gap-1.5 h-full justify-end group"
              >
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  ₹{day.revenue}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg transition hover:brightness-125"
                />
                <span className="text-[9px] text-slate-500 truncate w-full text-center">
                  {day.date.split("-").slice(1).join("/")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales by UTM Campaign (Module 1 & 6 Must-Have 7) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Sales & Orders by UTM Ad Campaign
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
              <tr>
                <th className="py-2">Campaign Name</th>
                <th className="py-2">Orders Brought</th>
                <th className="py-2">Generated Revenue</th>
                <th className="py-2 text-right">Avg Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {salesByCampaign?.map((cmp, i) => (
                <tr key={i}>
                  <td className="py-3 font-bold text-white">{cmp.campaign}</td>
                  <td className="py-3 text-sky-400 font-semibold">
                    {cmp.orders}
                  </td>
                  <td className="py-3 font-bold text-white">₹{cmp.revenue}</td>
                  <td className="py-3 text-right text-slate-400">
                    ₹{cmp.orders > 0 ? Math.round(cmp.revenue / cmp.orders) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;