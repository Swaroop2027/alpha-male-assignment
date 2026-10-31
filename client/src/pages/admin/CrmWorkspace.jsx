import React, { useEffect, useState } from "react";
import {
  Users,
  Download,
  Loader2,
  Star,
} from "lucide-react";
import api, { API_BASE_URL } from "../../api/axios";

const CrmWorkspace = () => {
  const [activeTab, setActiveTab] = useState("customers"); // 'customers', 'leads', 'abandoned', 'reviews'

  // Customers & Segments State
  const [customers, setCustomers] = useState([]);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [customer360, setCustomer360] = useState(null);

  // Leads State
  const [leads, setLeads] = useState([]);

  // Abandoned Carts State
  const [abandonedCarts, setAbandonedCarts] = useState([]);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("all"); // 'all', 'pending', 'approved'

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "customers") fetchCustomers();
    else if (activeTab === "leads") fetchLeads();
    else if (activeTab === "abandoned") fetchAbandonedCarts();
    else if (activeTab === "reviews") fetchReviews();
  }, [activeTab, segmentFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = "/crm/customers";
      if (segmentFilter !== "all") url += `?segment=${segmentFilter}`;
      const res = await api.get(url);
      setCustomers(res.data.data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer360 = async (phone) => {
    try {
      setSelectedPhone(phone);
      const res = await api.get(`/crm/customers/${phone}`);
      setCustomer360(res.data.data.profile);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/crm/leads");
      setLeads(res.data.data.leads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStage = async (leadId, newStatus) => {
    try {
      await api.patch(`/crm/leads/${leadId}`, { status: newStatus });
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/crm/abandoned-carts");
      setAbandonedCarts(res.data.data.carts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/post-purchase/reviews");
      setReviews(res.data.data.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateReview = async (reviewId, isApproved) => {
    try {
      await api.patch(`/post-purchase/reviews/${reviewId}/approve`, {
        isApproved,
      });
      fetchReviews();
    } catch (err) {
      alert(err.message || "Failed to update review status");
    }
  };

  // CSV Export Trigger
  const handleExportCsv = (type) => {
    window.open(`${API_BASE_URL}/api/crm/export/${type}`, "_blank");
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === "pending") return !r.isApproved;
    if (reviewFilter === "approved") return r.isApproved;
    return true;
  });

  const pendingReviewsCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Top Header & CSV Export Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>CRM, Retention & Customer 360</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer lifecycles, callback leads pipeline, and product
            reviews moderation
          </p>
        </div>

        {/* CSV Export Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            Export CSV:
          </span>
          <button
            onClick={() => handleExportCsv("orders")}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-sky-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => handleExportCsv("customers")}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-emerald-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>
          <button
            onClick={() => handleExportCsv("leads")}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Leads</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("customers")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "customers"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Customer 360 & Segments
        </button>

        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "leads"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Callback Leads Pipeline ({leads.length})
        </button>

        <button
          onClick={() => setActiveTab("abandoned")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "abandoned"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Abandoned Carts ({abandonedCarts.length})
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "reviews"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <span>Reviews Moderation</span>
          {pendingReviewsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
              {pendingReviewsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CUSTOMER 360 & SEGMENTS */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Segment Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold mr-1">
                Filter Segments:
              </span>
              {[
                { id: "all", label: "All Customers" },
                { id: "high-spenders", label: "Spent ₹5,000+" },
                { id: "repeat-buyers", label: "Repeat Buyers" },
                { id: "cod-rto", label: "COD with RTO" },
                { id: "inactive-30-days", label: "Bought Once, 30+ Days Ago" },
              ].map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => setSegmentFilter(seg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    segmentFilter === seg.id
                      ? "bg-sky-500/20 text-sky-400 border-sky-500"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            {/* Customers List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                  Loading customers...
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
                  {customers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No customers found in this segment.
                    </div>
                  ) : (
                    customers.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => fetchCustomer360(c.phone)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition ${
                          selectedPhone === c.phone
                            ? "bg-sky-950/40 border-l-4 border-sky-500"
                            : "hover:bg-slate-950/40"
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-white text-xs">{c.name}</h4>
                          <p className="text-[11px] text-slate-400">
                            +91 {c.phone} • {c.email || "No email"}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            First UTM: {c.firstUtmSource || "Direct"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-white text-sm block">
                            ₹{c.totalSpent}
                          </span>
                          <span className="text-[10px] text-sky-400 font-semibold">
                            {c.totalOrders} Orders
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer 360 Profile Panel */}
          <div className="lg:col-span-5">
            {customer360 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 sticky top-24">
                <div className="pb-4 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    Customer 360 View
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {customer360.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    +91 {customer360.phone} • {customer360.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Lifetime Spend
                    </p>
                    <p className="text-lg font-black text-white">
                      ₹{customer360.totalSpent}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Orders
                    </p>
                    <p className="text-lg font-black text-white">
                      {customer360.totalOrders}
                    </p>
                  </div>
                </div>

                {/* Orders History */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Order Timeline
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customer360.orders?.map((o) => (
                      <div
                        key={o._id}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between"
                      >
                        <div>
                          <span className="font-bold text-white">
                            #{o.orderId}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">
                            ₹{o.totalAmount}
                          </span>
                          <span className="text-[10px] text-emerald-400 block">
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                Click on any customer to inspect their full 360 profile
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEADS PIPELINE */}
      {activeTab === "leads" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              Loading callback leads...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {["New", "Contacted", "Interested", "Converted"].map((stage) => {
                const stageLeads = leads.filter((l) => l.status === stage);

                return (
                  <div
                    key={stage}
                    className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-bold text-white uppercase">
                        {stage}
                      </h4>
                      <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead._id}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <strong className="text-white">{lead.name}</strong>
                            <span className="text-[10px] text-slate-500">
                              {lead.utmSource}
                            </span>
                          </div>
                          <p className="text-slate-400">+91 {lead.phone}</p>

                          {/* Advance Pipeline Button */}
                          <div className="flex gap-1 pt-1">
                            {stage === "New" && (
                              <button
                                onClick={() =>
                                  handleUpdateLeadStage(lead._id, "Contacted")
                                }
                                className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[10px] font-bold"
                              >
                                Move ➔ Contacted
                              </button>
                            )}
                            {stage === "Contacted" && (
                              <button
                                onClick={() =>
                                  handleUpdateLeadStage(lead._id, "Interested")
                                }
                                className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold"
                              >
                                Move ➔ Interested
                              </button>
                            )}
                            {stage === "Interested" && (
                              <button
                                onClick={() =>
                                  handleUpdateLeadStage(lead._id, "Converted")
                                }
                                className="w-full py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg text-[10px] font-bold"
                              >
                                Move ➔ Converted 🎉
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ABANDONED CARTS */}
      {activeTab === "abandoned" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Unpaid Visitor Carts Captured for Sales Follow-up
          </h3>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              Loading abandoned carts...
            </div>
          ) : abandonedCarts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No abandoned carts recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {abandonedCarts.map((c) => (
                <div
                  key={c._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {c.customerName || "Shopper"}
                    </span>
                    <span className="text-xs text-sky-400 font-mono">
                      +91 {c.phone}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Source: {c.utm?.source || "direct"} • Last seen{" "}
                      {new Date(c.lastActivityAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white">
                      Cart Value: ₹{c.cartTotal}
                    </span>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={`https://wa.me/91${c.phone}?text=Hey%20${encodeURIComponent(c.customerName || "")},%20we%20noticed%20you%20left%20your%20Alpha%20Male%20cart.%20Use%20code%20ALPHA20%20for%20an%20exclusive%2020%25%20discount!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-xl text-xs font-semibold"
                      >
                        WhatsApp Follow-Up
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REVIEWS MODERATION */}
      {activeTab === "reviews" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Customer Reviews Moderation Queue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and approve public product comments to protect store credibility
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All Reviews" },
                { id: "pending", label: "Pending Approval" },
                { id: "approved", label: "Approved & Live" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    reviewFilter === f.id
                      ? "bg-sky-500/20 text-sky-400 border-sky-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              Loading reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No customer reviews found matching the filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredReviews.map((r) => (
                <div
                  key={r._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        {r.customerName}
                      </span>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        • {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      "{r.comment}"
                    </p>

                    <p className="text-[11px] text-sky-400">
                      Product: <strong>{r.product?.title || "Product"}</strong>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        r.isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {r.isApproved ? "Approved & Live" : "Pending Approval"}
                    </span>

                    <div className="flex gap-2">
                      {!r.isApproved ? (
                        <button
                          onClick={() => handleModerateReview(r._id, true)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                        >
                          Approve Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerateReview(r._id, false)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-xl text-xs font-semibold transition"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrmWorkspace;