import { amountInWords } from "./taxCalculator.js";

// ==========================================
// 1. GST TAX INVOICE (A4 Page Size)
// ==========================================
export const buildGstInvoice = (doc, order) => {
  const company = {
    name: process.env.COMPANY_NAME || "Alpha Male D2C Private Limited",
    gstin: process.env.COMPANY_GSTIN || "27AABCA1234F1Z8",
    address:
      process.env.COMPANY_ADDRESS ||
      "Plot 42, Andheri East, Mumbai, Maharashtra 400069",
    state: process.env.COMPANY_STATE || "Maharashtra",
    stateCode: process.env.COMPANY_STATE_CODE || "27",
    email: process.env.COMPANY_EMAIL || "info@alphamale.co.in",
  };

  // Header Banner
  doc.rect(0, 0, 595, 60).fill("#0f172a");
  doc
    .fillColor("#ffffff")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("ALPHA MALE", 40, 20);
  doc.fontSize(10).font("Helvetica").text("TAX INVOICE", 460, 25);

  doc.fillColor("#000000");
  let y = 80;

  // Seller & Buyer Details Section (2 Columns)
  doc.fontSize(9).font("Helvetica-Bold").text("SOLD BY (SELLER):", 40, y);
  doc.text("BILL TO / SHIP TO (BUYER):", 320, y);
  y += 14;

  doc.font("Helvetica").fontSize(8.5);
  doc.text(company.name, 40, y);
  doc.text(order.customer.name, 320, y);
  y += 12;

  doc.text(company.address, 40, y, { width: 250 });
  doc.text(
    `${order.shippingAddress.addressLine}${order.shippingAddress.landmark ? ", " + order.shippingAddress.landmark : ""}`,
    320,
    y,
    { width: 230 },
  );
  y += 24;

  doc.text(`GSTIN: ${company.gstin}`, 40, y);
  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    320,
    y,
  );
  y += 12;

  doc.text(`State: ${company.state} (Code: ${company.stateCode})`, 40, y);
  doc.text(
    `State: ${order.shippingAddress.state} (Code: ${order.shippingAddress.stateCode})`,
    320,
    y,
  );
  y += 12;

  doc.text(`Email: ${company.email}`, 40, y);
  doc.text(`Phone: +91 ${order.customer.phone}`, 320, y);
  y += 20;

  // Invoice Meta Box
  doc.rect(40, y, 515, 30).stroke("#cbd5e1");
  doc.font("Helvetica-Bold").fontSize(8.5);
  doc.text(`Invoice No: ${order.invoiceNumber || "PENDING"}`, 50, y + 10);
  doc.text(`Order ID: ${order.orderId}`, 200, y + 10);
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
    340,
    y + 10,
  );
  doc.text(`Payment: ${order.paymentMethod}`, 460, y + 10);
  y += 45;

  // Items Table Header
  doc.rect(40, y, 515, 20).fill("#f1f5f9");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(8);
  doc.text("#", 45, y + 6);
  doc.text("Item Description", 65, y + 6);
  doc.text("HSN", 260, y + 6);
  doc.text("Qty", 315, y + 6);
  doc.text("Rate", 355, y + 6);
  doc.text("Taxable", 415, y + 6);
  doc.text("Total (INR)", 485, y + 6);
  y += 22;

  doc.font("Helvetica").fontSize(8).fillColor("#000000");
  order.items.forEach((item, index) => {
    const itemTaxable =
      Math.round(((item.price * item.quantity) / 1.18) * 100) / 100;
    doc.text(String(index + 1), 45, y);
    doc.text(item.title, 65, y, { width: 190 });
    doc.text(item.hsnCode || "21069099", 260, y);
    doc.text(String(item.quantity), 320, y);
    doc.text(`Rs. ${item.price}`, 355, y);
    doc.text(`Rs. ${itemTaxable}`, 415, y);
    doc.text(`Rs. ${item.price * item.quantity}`, 485, y);
    y += 24;
  });

  doc.moveTo(40, y).lineTo(555, y).stroke("#cbd5e1");
  y += 10;

  // Tax and Total Summary Box
  const summaryLeft = 340;
  doc.font("Helvetica").fontSize(8.5);
  doc.text("Items Subtotal:", summaryLeft, y);
  doc.text(`Rs. ${order.itemsSubtotal}`, 480, y, { align: "right", width: 75 });
  y += 14;

  if (order.coupon?.discountAmount > 0) {
    doc.text(`Coupon Discount (${order.coupon.code}):`, summaryLeft, y);
    doc.text(`- Rs. ${order.coupon.discountAmount}`, 480, y, {
      align: "right",
      width: 75,
    });
    y += 14;
  }

  if (order.prepaidDiscount > 0) {
    doc.text("Prepaid Incentive (5%):", summaryLeft, y);
    doc.text(`- Rs. ${order.prepaidDiscount}`, 480, y, {
      align: "right",
      width: 75,
    });
    y += 14;
  }

  doc.text("Taxable Amount:", summaryLeft, y);
  doc.text(`Rs. ${order.taxableAmount}`, 480, y, { align: "right", width: 75 });
  y += 14;

  if (order.isInterState) {
    doc.text("Integrated GST (IGST @ 18%):", summaryLeft, y);
    doc.text(`Rs. ${order.igst}`, 480, y, { align: "right", width: 75 });
    y += 14;
  } else {
    doc.text("Central GST (CGST @ 9%):", summaryLeft, y);
    doc.text(`Rs. ${order.cgst}`, 480, y, { align: "right", width: 75 });
    y += 14;
    doc.text("State GST (SGST @ 9%):", summaryLeft, y);
    doc.text(`Rs. ${order.sgst}`, 480, y, { align: "right", width: 75 });
    y += 14;
  }

  doc.text("Shipping & Handling:", summaryLeft, y);
  doc.text("FREE", 480, y, { align: "right", width: 75 });
  y += 16;

  // Grand Total Highlight
  doc.rect(summaryLeft - 10, y - 4, 225, 24).fill("#0f172a");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
  doc.text("GRAND TOTAL:", summaryLeft, y + 2);
  doc.text(`Rs. ${order.totalAmount}`, 470, y + 2, {
    align: "right",
    width: 75,
  });
  doc.fillColor("#000000");
  y += 35;

  // Amount in Words
  doc.font("Helvetica-Bold").fontSize(8.5).text("Amount in Words:", 40, y);
  doc.font("Helvetica").text(amountInWords(order.totalAmount), 125, y);
  y += 25;

  // Footer / Declaration
  doc.rect(40, y, 515, 50).stroke("#cbd5e1");
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("Declaration:", 50, y + 6);
  doc
    .font("Helvetica")
    .fontSize(7)
    .text(
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold are subject to Mumbai jurisdiction.",
      50,
      y + 18,
      { width: 330 },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("For Alpha Male D2C Pvt Ltd", 400, y + 8);
  doc
    .font("Helvetica")
    .fontSize(7)
    .text("Authorized Signatory", 430, y + 36);
};

// ==========================================
// 2. 4×6 INCH THERMAL SHIPPING LABEL
// Dimensions: 288 x 432 points
// ==========================================
export const buildShippingLabel = (doc, order) => {
  // Border box
  doc.rect(10, 10, 268, 412).stroke("#000000");

  // Header: Courier & Routing
  doc.rect(10, 10, 268, 35).fill("#0f172a");
  doc
    .fillColor("#ffffff")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("ALPHA MALE", 18, 16);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(order.courier?.name || "Shiprocket Express", 160, 24, {
      width: 110,
      align: "right",
    });
  doc.fillColor("#000000");

  let y = 55;

  // COD or PREPAID Big Badge
  if (order.paymentMethod === "COD") {
    doc.rect(15, y, 258, 42).fill("#fee2e2").stroke("#dc2626");
    doc
      .fillColor("#991b1b")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("CASH ON DELIVERY (COD)", 20, y + 6, { align: "center" });
    doc
      .fontSize(14)
      .text(`COLLECT CASH: Rs. ${order.totalAmount}`, 20, y + 22, {
        align: "center",
      });
  } else {
    doc.rect(15, y, 258, 42).fill("#dcfce7").stroke("#16a34a");
    doc
      .fillColor("#166534")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("PREPAID SHIPMENT", 20, y + 6, { align: "center" });
    doc
      .fontSize(11)
      .text("DO NOT COLLECT CASH FROM CUSTOMER", 20, y + 23, {
        align: "center",
      });
  }
  doc.fillColor("#000000");
  y += 50;

  // Barcode Mock Representation
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`ORDER ID: ${order.orderId}`, 15, y);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`AWB: ${order.courier?.awbNumber || "SR-AWB-PENDING"}`, 170, y);
  y += 14;

  // Draw simulated barcode lines
  const barcodeY = y;
  for (let x = 20; x < 265; x += 4) {
    const lineWidth = x % 3 === 0 ? 2.5 : 1;
    doc
      .moveTo(x, barcodeY)
      .lineTo(x, barcodeY + 28)
      .lineWidth(lineWidth)
      .stroke("#000000");
  }
  y += 35;

  // Ship To Address Box
  doc.rect(15, y, 258, 95).stroke("#cbd5e1");
  doc.font("Helvetica-Bold").fontSize(8.5).text("SHIP TO:", 22, y + 8);
  doc.font("Helvetica-Bold").fontSize(10).text(order.customer.name, 22, y + 20);
  doc.font("Helvetica").fontSize(8.5);
  doc.text(order.shippingAddress.addressLine, 22, y + 33, { width: 240 });
  if (order.shippingAddress.landmark) {
    doc.text(`Landmark: ${order.shippingAddress.landmark}`, 22, y + 46);
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      22,
      y + 60,
    );
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`Phone: +91 ${order.customer.phone}`, 22, y + 78);
  y += 105;

  // Package Details Table
  doc.rect(15, y, 258, 60).stroke("#cbd5e1");
  doc.font("Helvetica-Bold").fontSize(8).text("PACKAGE CONTENTS:", 22, y + 6);
  doc.font("Helvetica").fontSize(7.5);
  let itemLineY = y + 18;
  order.items.slice(0, 3).forEach((item) => {
    doc.text(
      `• ${item.title.substring(0, 32)}... (Qty: ${item.quantity})`,
      22,
      itemLineY,
    );
    itemLineY += 11;
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("Weight: 250 g | Dimensions: 15x10x8 cm", 22, y + 47);
  y += 68;

  // Return to Sender Address
  doc.rect(15, y, 258, 48).fill("#f8fafc").stroke("#cbd5e1");
  doc
    .fillColor("#334155")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("RETURN IF UNDELIVERED TO (SELLER):", 20, y + 5);
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .text(
      `${process.env.COMPANY_NAME || "Alpha Male D2C Private Limited"}\nPlot 42, Andheri East, Mumbai, MH - 400069\nContact: +91 9876543210 | info@alphamale.co.in`,
      20,
      y + 15,
      { width: 245 },
    );
  doc.fillColor("#000000");
};
