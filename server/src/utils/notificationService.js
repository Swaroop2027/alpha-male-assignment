import nodemailer from "nodemailer";

// Configure Nodemailer transporter (Fallback to Ethereal test SMTP if not set in .env)
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ethereal.email",
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Generate automatic Ethereal test credentials for sandbox
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

// Pluggable SMS / WhatsApp Service (Mocked / Console Logger)
export const sendSmsOrWhatsApp = ({ channel = "WhatsApp", phone, message }) => {
  console.log(
    `📱 [${channel.toUpperCase()} NOTIFICATION] To: +91-${phone}`,
  );
  console.log(`💬 Message: "${message}"`);
  console.log("----------------------------------------------------");
  return { success: true, timestamp: new Date() };
};

// Send Order Confirmation Notification (Module 5 Must-Have 2)
export const sendOrderPlacedNotification = async (order) => {
  try {
    const transporter = await createTransporter();

    // 1. Email Notification
    if (order.customer.email) {
      const mailOptions = {
        from: `"Alpha Male Performance" <${process.env.COMPANY_EMAIL || "orders@alphamale.co.in"}>`,
        to: order.customer.email,
        subject: `Order Confirmed: #${order.orderId} - Alpha Male`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a;">Thank You for Your Order, ${order.customer.name}!</h2>
            <p>Your order <strong>#${order.orderId}</strong> has been received and is being prepared.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p style="margin: 0;"><strong>Amount:</strong> ₹${order.totalAmount}</p>
              <p style="margin: 0;"><strong>Delivery To:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
            </div>
            <p>You can track your order anytime using your Order ID and phone number.</p>
            <p style="color: #64748b; font-size: 12px;">Alpha Male D2C Private Limited | Mumbai</p>
          </div>
        `,
      };
      const info = await transporter.sendMail(mailOptions);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(
          `📧 Order Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
        );
      }
    }

    // 2. WhatsApp Notification
    sendSmsOrWhatsApp({
      channel: "WhatsApp",
      phone: order.customer.phone,
      message: `Hey ${order.customer.name}! Your Alpha Male order #${order.orderId} for ₹${order.totalAmount} is confirmed. We will notify you once dispatched!`,
    });
  } catch (err) {
    console.error("Notification dispatch error (Order Placed):", err.message);
  }
};

// Send Order Shipped Notification
export const sendOrderShippedNotification = async (order) => {
  try {
    sendSmsOrWhatsApp({
      channel: "WhatsApp",
      phone: order.customer.phone,
      message: `Great news ${order.customer.name}! Your order #${order.orderId} has been shipped via ${order.courier?.name || "Shiprocket Express"}. Tracking AWB: ${order.courier?.awbNumber || "In Transit"}. Track here: ${order.courier?.trackingUrl || "https://alphamale.co.in/track"}`,
    });
  } catch (err) {
    console.error("Notification dispatch error (Order Shipped):", err.message);
  }
};

// Send Order Delivered Notification
export const sendOrderDeliveredNotification = async (order) => {
  try {
    sendSmsOrWhatsApp({
      channel: "WhatsApp",
      phone: order.customer.phone,
      message: `Delivered! Your Alpha Male package #${order.orderId} has been delivered. Enjoy your peak performance! (7-day hassle-free return window active).`,
    });
  } catch (err) {
    console.error("Notification dispatch error (Order Delivered):", err.message);
  }
};
