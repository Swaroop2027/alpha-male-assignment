import React, { useState } from "react";
import {
  Truck,
  Search,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const OrderTracking = () => {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState("");

  // Return Request State
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("Damaged or broken seal");
  const [returnDesc, setReturnDesc] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMsg, setReturnMsg] = useState("");

  // Support Ticket State
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketMsg, setTicketMsg] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId || !phone) {
      setError("Please provide both Order ID and Phone Number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTrackingData(null);
      const res = await api.post("/post-purchase/track", { orderId, phone });
      setTrackingData(res.data.data);
    } catch (err) {
      setError(err.message || "No order found with provided details");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setReturnLoading(true);
      const res = await api.post("/post-purchase/returns", {
        orderId: trackingData.orderId,
        phone,
        items: trackingData.items,
        reason: returnReason,
        description: returnDesc,
      });
      setReturnMsg(res.data.message);
    } catch (err) {
      setReturnMsg(err.message || "Failed to submit return request");
    } finally {
      setReturnLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setTicketLoading(true);
      const res = await api.post("/post-purchase/tickets", {
        orderId: trackingData.orderId,
        customerName: "Customer",
        customerPhone: phone,
        subject: ticketSubject,
        message: ticketMessage,
      });
      setTicketMsg(res.data.message);
    } catch (err) {
      setTicketMsg(err.message || "Failed to submit ticket");
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl w-fit mx-auto mb-3">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Track Your Shipment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enter your Order ID (e.g. AM-2026-1001) and registered 10-digit mobile
          number.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-10">
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleTrack}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Order ID *
            </label>
            <input
              type="text"
              placeholder="e.g. AM-2026-1001"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase().trim())}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              10-Digit Mobile *
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" /> Track
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tracking Results */}
      {trackingData && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fadeIn">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-sky-400">
                Order #{trackingData.orderId}
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                Status: {trackingData.status}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Placed on{" "}
                {new Date(trackingData.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "long",
                })}{" "}
                • Destination: {trackingData.shippingAddress.city},{" "}
                {trackingData.shippingAddress.state}
              </p>
            </div>

            {/* Courier AWB Badge */}
            {trackingData.courier?.awbNumber ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    Courier Partner
                  </p>
                  <p className="text-xs font-bold text-white">
                    {trackingData.courier.name}
                  </p>
                  <p className="text-[11px] text-sky-400 font-mono">
                    AWB: {trackingData.courier.awbNumber}
                  </p>
                </div>
                {trackingData.courier.trackingUrl && (
                  <a
                    href={trackingData.courier.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl transition"
                    title="Live Courier GPS Tracking"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl font-medium">
                Warehouse Packing in Progress
              </span>
            )}
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Milestone Timeline
            </h3>
            <div className="space-y-4">
              {trackingData.statusTimeline?.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase">
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      {new Date(item.updatedAt).toLocaleDateString("en-IN")}{" "}
                      {new Date(item.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.note && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row: Returns & Support */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-4">
            {trackingData.status === "Delivered" && (
              <button
                onClick={() => setShowReturnForm(!showReturnForm)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Return / Refund (7-Day Window)</span>
              </button>
            )}

            <button
              onClick={() => setShowTicketForm(!showTicketForm)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Contact Support for this Order</span>
            </button>
          </div>

          {/* Return Form (Module 5 Must-Have 3) */}
          {showReturnForm && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Submit 7-Day Return Request</span>
              </h4>

              {returnMsg ? (
                <div className="p-3 bg-emerald-950 border border-emerald-900 text-emerald-300 text-xs rounded-xl">
                  {returnMsg}
                </div>
              ) : (
                <form onSubmit={handleReturnSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Reason for Return *
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="Damaged or broken seal">
                        Damaged or broken seal
                      </option>
                      <option value="Wrong product delivered">
                        Wrong product delivered
                      </option>
                      <option value="Expired product">Expired product</option>
                      <option value="Quality not satisfactory">
                        Quality not satisfactory
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Detailed Explanation
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Please elaborate on the issue..."
                      value={returnDesc}
                      onChange={(e) => setReturnDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={returnLoading}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    {returnLoading
                      ? "Submitting Request..."
                      : "Submit Return for Admin Approval"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Support Ticket Form (Module 5 Must-Have 4) */}
          {showTicketForm && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Raise Support Ticket for #{trackingData.orderId}</span>
              </h4>

              {ticketMsg ? (
                <div className="p-3 bg-emerald-950 border border-emerald-900 text-emerald-300 text-xs rounded-xl">
                  {ticketMsg}
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Courier delivery delay query"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Your Message *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your issue..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketLoading}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    {ticketLoading ? "Sending..." : "Create Support Ticket"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;