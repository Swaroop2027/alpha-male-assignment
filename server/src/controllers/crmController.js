import Order from "../models/Order.js";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import AbandonedCart from "../models/AbandonedCart.js";
import ReturnRequest from "../models/ReturnRequest.js";
import SupportTicket from "../models/SupportTicket.js";
import Product from "../models/Product.js";
import { ApiError, sendResponse } from "../utils/apiResponse.js";

// Helper: Convert array of objects to CSV string
const convertToCsv = (data, fields) => {
  const header = fields.join(",");
  const rows = data.map((item) =>
    fields
      .map((field) => {
        let val = field.split(".").reduce((obj, key) => obj?.[key], item);
        if (val === undefined || val === null) val = "";
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(","),
  );
  return [header, ...rows].join("\r\n");
};

// ==========================================
// 1. DASHBOARD ANALYTICS (Module 6 Must-Have 7 & 8)
// ==========================================
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchFilter = {};

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate)
        matchFilter.createdAt.$lte = new Date(
          new Date(endDate).setHours(23, 59, 59),
        );
    }

    const allOrders = await Order.find(matchFilter);

    // 1. Core KPIs
    const totalOrdersCount = allOrders.length;
    const paidOrConfirmedOrders = allOrders.filter(
      (o) =>
        o.paymentStatus === "Paid" ||
        o.orderStatus === "Confirmed" ||
        o.orderStatus === "Delivered",
    );
    const totalRevenue = paidOrConfirmedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );
    const aov =
      paidOrConfirmedOrders.length > 0
        ? Math.round(totalRevenue / paidOrConfirmedOrders.length)
        : 0;

    // 2. Prepaid vs COD Split
    const prepaidCount = allOrders.filter(
      (o) => o.paymentMethod === "Prepaid",
    ).length;
    const codCount = allOrders.filter((o) => o.paymentMethod === "COD").length;
    const prepaidPercentage =
      totalOrdersCount > 0
        ? Math.round((prepaidCount / totalOrdersCount) * 100)
        : 0;
    const codPercentage = totalOrdersCount > 0 ? 100 - prepaidPercentage : 0;

    // 3. RTO % (Returned-to-Origin)
    const rtoCount = allOrders.filter((o) => o.orderStatus === "RTO").length;
    const rtoRate =
      totalOrdersCount > 0
        ? Number(((rtoCount / totalOrdersCount) * 100).toFixed(1))
        : 0;

    // 4. Repeat Customer Rate
    const customerOrderCounts = {};
    allOrders.forEach((o) => {
      const ph = o.customer.phone;
      customerOrderCounts[ph] = (customerOrderCounts[ph] || 0) + 1;
    });
    const uniqueCustomersCount = Object.keys(customerOrderCounts).length;
    const repeatCustomersCount = Object.values(customerOrderCounts).filter(
      (cnt) => cnt > 1,
    ).length;
    const repeatRate =
      uniqueCustomersCount > 0
        ? Number(
            ((repeatCustomersCount / uniqueCustomersCount) * 100).toFixed(1),
          )
        : 0;

    // 5. Daily Revenue Breakdown (Chart Data)
    const dailyMap = {};
    allOrders.forEach((o) => {
      const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
      if (!dailyMap[dateStr])
        dailyMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      dailyMap[dateStr].orders += 1;
      if (
        o.paymentStatus === "Paid" ||
        o.orderStatus === "Confirmed" ||
        o.orderStatus === "Delivered"
      ) {
        dailyMap[dateStr].revenue += o.totalAmount;
      }
    });
    const dailyTrend = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // 6. Sales by UTM Campaign
    const campaignMap = {};
    allOrders.forEach((o) => {
      const cmp = o.utm?.campaign || "direct";
      if (!campaignMap[cmp])
        campaignMap[cmp] = { campaign: cmp, orders: 0, revenue: 0 };
      campaignMap[cmp].orders += 1;
      campaignMap[cmp].revenue += o.totalAmount;
    });
    const salesByCampaign = Object.values(campaignMap).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // 7. Low Stock Alerts
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).select("title sku stock lowStockThreshold");

    return sendResponse(res, 200, "Dashboard analytics retrieved", {
      metrics: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        aov,
        prepaidPercentage,
        codPercentage,
        rtoRate,
        repeatRate,
        lowStockAlertsCount: lowStockProducts.length,
      },
      dailyTrend,
      salesByCampaign,
      lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CUSTOMER 360 & SEGMENTS (Module 6 Must-Have 2 & 5)
// ==========================================
export const getCustomersList = async (req, res, next) => {
  try {
    const { segment } = req.query;

    // Aggregate unique customers by Phone number
    const customersAggregation = await Order.aggregate([
      {
        $group: {
          _id: "$customer.phone",
          name: { $first: "$customer.name" },
          email: { $first: "$customer.email" },
          phone: { $first: "$customer.phone" },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          firstUtmSource: { $first: "$utm.source" },
          hasRTO: {
            $max: {
              $cond: [{ $eq: ["$orderStatus", "RTO"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    let filtered = customersAggregation;

    // Segments Filter
    if (segment === "high-spenders") {
      filtered = filtered.filter((c) => c.totalSpent >= 5000);
    } else if (segment === "repeat-buyers") {
      filtered = filtered.filter((c) => c.totalOrders > 1);
    } else if (segment === "cod-rto") {
      filtered = filtered.filter((c) => c.hasRTO === 1);
    } else if (segment === "inactive-30-days") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (c) =>
          c.totalOrders === 1 && new Date(c.lastOrderDate) <= thirtyDaysAgo,
      );
    }

    return sendResponse(res, 200, "Customers list retrieved", {
      total: filtered.length,
      customers: filtered,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomer360Profile = async (req, res, next) => {
  try {
    const { phone } = req.params;

    const orders = await Order.find({ "customer.phone": phone }).sort({
      createdAt: -1,
    });
    if (orders.length === 0)
      throw new ApiError(
        "No customer records found for this phone number",
        404,
      );

    const customerUser = await User.findOne({ phone });
    const tickets = await SupportTicket.find({ customerPhone: phone });
    const returns = await ReturnRequest.find({ "customer.phone": phone });

    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const profile = {
      name: orders[0].customer.name,
      phone: orders[0].customer.phone,
      email: orders[0].customer.email,
      firstUtmSource: orders[orders.length - 1].utm?.source || "Direct",
      totalOrders: orders.length,
      totalSpent,
      tags: customerUser?.tags || ["Active Shopper"],
      teamNotes: customerUser?.teamNotes || [],
      orders,
      tickets,
      returns,
    };

    return sendResponse(res, 200, "Customer 360 profile retrieved", {
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. LEADS PIPELINE (Module 6 Must-Have 3)
// ==========================================
export const createLead = async (req, res, next) => {
  try {
    const { name, phone, email, interestedProduct, utmSource } = req.body;
    if (!name || !phone) throw new ApiError("Name and phone are required", 400);

    const lead = await Lead.create({
      name,
      phone,
      email: email || "",
      interestedProduct: interestedProduct || null,
      utmSource: utmSource || "Website Callback",
      status: "New",
    });

    return sendResponse(
      res,
      201,
      "Callback requested! Our team will call you shortly.",
      { lead },
    );
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};

    const leads = await Lead.find(query)
      .populate("interestedProduct", "title price images")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, "Leads retrieved", { leads });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, followUpDate } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) throw new ApiError("Lead not found", 404);

    if (status) lead.status = status;
    if (followUpDate) lead.followUpDate = new Date(followUpDate);
    if (note) {
      lead.notes.push({
        note,
        addedBy: req.user.name,
        createdAt: new Date(),
      });
    }

    await lead.save();
    return sendResponse(res, 200, "Lead updated", { lead });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ABANDONED CARTS (Module 6 Must-Have 4)
// ==========================================
export const captureAbandonedCart = async (req, res, next) => {
  try {
    const { phone, customerName, email, items, cartTotal, utm } = req.body;
    if (!phone || !items || items.length === 0) {
      throw new ApiError("Phone and items are required", 400);
    }

    // Upsert recent cart for this phone
    let cart = await AbandonedCart.findOne({ phone, isRecovered: false });
    if (cart) {
      cart.items = items;
      cart.cartTotal = cartTotal;
      cart.lastActivityAt = new Date();
      await cart.save();
    } else {
      cart = await AbandonedCart.create({
        phone,
        customerName: customerName || "Shopper",
        email: email || "",
        items,
        cartTotal,
        utm,
      });
    }

    return sendResponse(res, 200, "Cart state synced", { cart });
  } catch (error) {
    next(error);
  }
};

export const getAbandonedCarts = async (req, res, next) => {
  try {
    const carts = await AbandonedCart.find({ isRecovered: false }).sort({
      lastActivityAt: -1,
    });
    return sendResponse(res, 200, "Abandoned carts retrieved", { carts });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. CSV EXPORT (Module 6 Must-Have 9)
// ==========================================
export const exportDataAsCsv = async (req, res, next) => {
  try {
    const { type } = req.params; // 'orders', 'customers', 'leads'

    let csvContent = "";
    let filename = `${type}-export-${Date.now()}.csv`;

    if (type === "orders") {
      const orders = await Order.find().sort({ createdAt: -1 });
      const fields = [
        "orderId",
        "customer.name",
        "customer.phone",
        "customer.email",
        "totalAmount",
        "paymentMethod",
        "paymentStatus",
        "orderStatus",
        "utm.source",
        "utm.campaign",
        "createdAt",
      ];
      csvContent = convertToCsv(orders, fields);
    } else if (type === "leads") {
      const leads = await Lead.find().sort({ createdAt: -1 });
      const fields = [
        "name",
        "phone",
        "email",
        "status",
        "utmSource",
        "createdAt",
      ];
      csvContent = convertToCsv(leads, fields);
    } else if (type === "customers") {
      const orders = await Order.find();
      const customerMap = {};
      orders.forEach((o) => {
        const ph = o.customer.phone;
        if (!customerMap[ph]) {
          customerMap[ph] = {
            name: o.customer.name,
            phone: ph,
            email: o.customer.email,
            ordersCount: 0,
            totalSpent: 0,
            utmSource: o.utm?.source || "direct",
          };
        }
        customerMap[ph].ordersCount += 1;
        customerMap[ph].totalSpent += o.totalAmount;
      });
      const customers = Object.values(customerMap);
      const fields = [
        "name",
        "phone",
        "email",
        "ordersCount",
        "totalSpent",
        "utmSource",
      ];
      csvContent = convertToCsv(customers, fields);
    } else {
      throw new ApiError(
        "Invalid export type. Allowed: orders, leads, customers",
        400,
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
