import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ListOrdered,
} from "lucide-react";
import api, { API_BASE_URL } from "../../api/axios";

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Selected Orders for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Single Order Detail Modal
  const [activeOrder, setActiveOrder] = useState(null);
  const [statusNote, setStatusNote] = useState("");

  // Picklist Modal State
  const [picklistData, setPicklistData] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/fulfillment/orders?page=${page}&limit=12`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (paymentFilter !== "all") url += `&paymentMethod=${paymentFilter}`;

      const res = await api.get(url);
      setOrders(res.data.data.orders);
      setTotalOrders(res.data.data.totalOrders);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  // Toggle Checkbox selection
  const toggleSelectOrder = (orderId) => {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const selectAllCurrentPage = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.orderId));
    }
  };

  // Bulk Mark as Packed (Module 4 Must-Have 6)
  const handleBulkPack = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      const res = await api.post("/fulfillment/bulk/pack", {
        orderIds: selectedIds,
      });
      setActionMessage(res.data.message);
      fetchOrders();
      setSelectedIds([]);
    } catch (err) {
      setActionMessage(err.message || "Bulk pack failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Print Invoices (Uses Axios with Blob & Token Fallback)
  const handleBulkPrintInvoices = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      setActionMessage("Generating Bulk Invoices PDF...");
      const res = await api.post(
        "/fulfillment/bulk/print-invoices",
        { orderIds: selectedIds },
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(fileUrl, "_blank");
      if (!newTab) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `Bulk-Invoices-${Date.now()}.pdf`;
        link.click();
      }
      setActionMessage("✓ Bulk Invoices PDF opened successfully!");
    } catch {
      const token = localStorage.getItem("alpha_token") || "";
      window.open(
        `${API_BASE_URL}/api/fulfillment/bulk/print-invoices?orderIds=${selectedIds.join(",")}&token=${encodeURIComponent(token)}`,
        "_blank",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Print 4x6 Thermal Labels (Uses Axios with Blob & Token Fallback)
  const handleBulkPrintLabels = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      setActionMessage("Generating Bulk 4x6\" Thermal Labels PDF...");
      const res = await api.post(
        "/fulfillment/bulk/print-labels",
        { orderIds: selectedIds },
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(fileUrl, "_blank");
      if (!newTab) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `Bulk-ShippingLabels-${Date.now()}.pdf`;
        link.click();
      }
      setActionMessage("✓ Bulk 4x6\" Labels PDF opened successfully!");
    } catch {
      const token = localStorage.getItem("alpha_token") || "";
      window.open(
        `${API_BASE_URL}/api/fulfillment/bulk/print-labels?orderIds=${selectedIds.join(",")}&token=${encodeURIComponent(token)}`,
        "_blank",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // View Warehouse Picklist
  const handleViewPicklist = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      const res = await api.post("/fulfillment/bulk/picklist", {
        orderIds: selectedIds,
      });
      setPicklistData(res.data.data);
    } catch (err) {
      setActionMessage(err.message || "Picklist generation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Update Status for Active Order
  const handleUpdateStatus = async (newStatus) => {
    try {
      setBulkLoading(true);
      const res = await api.patch(
        `/fulfillment/orders/${activeOrder.orderId}/status`,
        {
          status: newStatus,
          note: statusNote,
        },
      );
      setActiveOrder(res.data.data.order);
      setStatusNote("");
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setBulkLoading(false);
    }
  };

  // Book Courier Shipment with Shiprocket
  const handleBookCourier = async (orderId) => {
    try {
      setBulkLoading(true);
      const res = await api.post(`/fulfillment/orders/${orderId}/book-courier`);
      setActionMessage(
        `✓ Shipment booked! AWB: ${res.data.data.courier.awbNumber}`,
      );
      if (activeOrder) setActiveOrder(res.data.data);
      fetchOrders();
    } catch (err) {
      setActionMessage(err.message || "Courier booking failed");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-400" />
              <span>Orders & Shipping Operations ({totalOrders})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live fulfillment queue with GST tax invoices and 4x6" thermal
              labels
            </p>
          </div>

          {actionMessage && (
            <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-900 text-emerald-300 text-xs rounded-xl font-medium animate-fadeIn">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="sm:col-span-5 flex gap-2"
          >
            <input
              type="text"
              placeholder="Search Order ID, Customer Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Status Filter */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="all">All Order Statuses</option>
              <option value="New">New Orders</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="RTO">RTO</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-3">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="all">All Payment Types</option>
              <option value="Prepaid">Prepaid Online</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Module 4 Must-Have 6) */}
      {selectedIds.length > 0 && (
        <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-300">
              {selectedIds.length} orders selected:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkPack}
              disabled={bulkLoading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Mark Packed</span>
            </button>

            <button
              onClick={handleBulkPrintInvoices}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bulk Invoices PDF</span>
            </button>

            <button
              onClick={handleBulkPrintLabels}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Bulk 4x6" Labels PDF</span>
            </button>

            <button
              onClick={handleViewPicklist}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Warehouse Picklist</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === orders.length
                    }
                    onChange={selectAllCurrentPage}
                    className="rounded text-sky-500"
                  />
                </th>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer & City</th>
                <th className="p-4">Items</th>
                <th className="p-4">Payment & Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Courier / AWB</th>
                <th className="p-4 text-right">PDF & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    Loading orders queue...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-950/40 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.orderId)}
                        onChange={() => toggleSelectOrder(o.orderId)}
                        className="rounded text-sky-500"
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setActiveOrder(o)}
                        className="font-bold text-white hover:text-sky-400 text-left"
                      >
                        {o.orderId}
                      </button>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white block">
                        {o.customer.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        +91 {o.customer.phone} • {o.shippingAddress.city}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">
                        {o.items
                          .map(
                            (it) =>
                              `${it.title.split("-")[0]} (x${it.quantity})`,
                          )
                          .join(", ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">
                        ₹{o.totalAmount}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          o.paymentMethod === "Prepaid"
                            ? "text-sky-400"
                            : "text-amber-400"
                        }`}
                      >
                        {o.paymentMethod}{" "}
                        {o.paymentStatus === "Paid" ? "(Paid)" : "(Unpaid)"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          o.orderStatus === "Delivered"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : o.orderStatus === "Shipped"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                              : o.orderStatus === "Packed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      {o.courier?.awbNumber ? (
                        <div>
                          <span className="text-[11px] font-mono font-bold text-sky-400 block">
                            {o.courier.awbNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {o.courier.name}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBookCourier(o.orderId)}
                          disabled={bulkLoading}
                          className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-400 font-semibold rounded-lg text-[10px] transition"
                        >
                          Book Courier
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* GST Invoice PDF */}
                        <a
                          href={`${API_BASE_URL}/api/fulfillment/orders/${o.orderId}/invoice-pdf${localStorage.getItem("alpha_token") ? `?token=${encodeURIComponent(localStorage.getItem("alpha_token"))}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                          title="Print GST Invoice PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>

                        {/* 4x6 Thermal Label PDF */}
                        <a
                          href={`${API_BASE_URL}/api/fulfillment/orders/${o.orderId}/shipping-label-pdf${localStorage.getItem("alpha_token") ? `?token=${encodeURIComponent(localStorage.getItem("alpha_token"))}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                          title="Print 4x6 Thermal Label PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => setActiveOrder(o)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px]"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {totalPages} ({totalOrders} orders)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal with Timeline & Status Change */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-sky-400">
                  #{activeOrder.orderId}
                </span>
                <h3 className="text-lg font-black text-white">
                  Order Details & Status Workflow
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Workflow Buttons */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Advance Order Status
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Confirmed",
                  "Packed",
                  "Shipped",
                  "Out for delivery",
                  "Delivered",
                  "Cancelled",
                  "RTO",
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    disabled={activeOrder.orderStatus === st}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      activeOrder.orderStatus === st
                        ? "bg-sky-500 text-slate-950 border-sky-400"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">
                  Customer
                </p>
                <p className="text-white font-bold">
                  {activeOrder.customer.name}
                </p>
                <p className="text-slate-400">
                  +91 {activeOrder.customer.phone}
                </p>
                <p className="text-slate-400">{activeOrder.customer.email}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">
                  Shipping Address
                </p>
                <p className="text-white">
                  {activeOrder.shippingAddress.addressLine}
                </p>
                <p className="text-slate-400">
                  {activeOrder.shippingAddress.city},{" "}
                  {activeOrder.shippingAddress.state} -{" "}
                  {activeOrder.shippingAddress.pincode}
                </p>
                <p className="text-slate-400">
                  UTM Source: {activeOrder.utm?.source || "Direct"}
                </p>
              </div>
            </div>

            {/* Status Audit Log (Module 4 Must-Have 2: who changed it and when) */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Audit Log (Who Made It & When)
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeOrder.statusHistory?.map((log, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sky-400 uppercase">
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.updatedAt).toLocaleDateString()}{" "}
                        {new Date(log.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Updated by: <strong>{log.updatedBy?.name}</strong> (
                      {log.updatedBy?.role}) • {log.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PDFs Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <a
                href={`${API_BASE_URL}/api/fulfillment/orders/${activeOrder.orderId}/invoice-pdf${localStorage.getItem("alpha_token") ? `?token=${encodeURIComponent(localStorage.getItem("alpha_token"))}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Open GST Tax Invoice PDF</span>
              </a>

              <a
                href={`${API_BASE_URL}/api/fulfillment/orders/${activeOrder.orderId}/shipping-label-pdf${localStorage.getItem("alpha_token") ? `?token=${encodeURIComponent(localStorage.getItem("alpha_token"))}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Open 4x6" Thermal Label PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Picklist Modal */}
      {picklistData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-purple-400" />
                <span>
                  Warehouse Picklist ({picklistData.ordersCount} Orders,{" "}
                  {picklistData.totalItemsCount} Units)
                </span>
              </h3>
              <button
                onClick={() => setPicklistData(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pick the aggregated inventory below from the warehouse racks
              before dispatch packing:
            </p>

            <div className="space-y-2">
              {picklistData.picklist?.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      HSN: {item.hsnCode}
                    </span>
                  </div>
                  <span className="text-base font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg">
                    {item.totalQuantity} units
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Print Picklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;