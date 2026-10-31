import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  price: { type: Number, required: true }, // Selling price at purchase time
  quantity: { type: Number, required: true, min: 1 },
  hsnCode: { type: String, default: '21069099' },
  image: { type: String }
});

const statusLogSchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'System' },
    role: { type: String, default: 'System' }
  },
  note: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true // E.g. AM-2026-1001
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true // Assigned when confirmed/paid: E.g. INV-2026-0001
    },
    // Customer Info (Guest or Logged in)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true } // 10-digit mobile
    },
    shippingAddress: {
      addressLine: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      stateCode: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    items: [orderItemSchema],

    // Server-calculated Amounts
    itemsSubtotal: { type: Number, required: true },
    coupon: {
      code: { type: String },
      discountAmount: { type: Number, default: 0 }
    },
    prepaidDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    isInterState: { type: Boolean, default: false }, // true if outside Maharashtra
    cgst: { type: Number, default: 0 }, // 9% for intra-state
    sgst: { type: Number, default: 0 }, // 9% for intra-state
    igst: { type: Number, default: 0 }, // 18% for inter-state
    totalTax: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Net Payable

    // Payment Information (Module 3)
    paymentMethod: {
      type: String,
      enum: ['Prepaid', 'COD'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    razorpay: {
      orderId: { type: String },
      paymentId: { type: String },
      signature: { type: String }
    },
    codConfirmed: {
      type: Boolean,
      default: false
    },
    stockReduced: {
      type: Boolean,
      default: false // Stock updates only when Paid or COD Confirmed!
    },

    // Fulfilment & Shipping (Module 4)
    orderStatus: {
      type: String,
      enum: [
        'New',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for delivery',
        'Delivered',
        'Cancelled',
        'RTO',
        'Returned'
      ],
      default: 'New'
    },
    statusHistory: [statusLogSchema],
    courier: {
      name: { type: String, default: 'Shiprocket Express' },
      bookingId: { type: String },
      awbNumber: { type: String },
      trackingUrl: { type: String },
      bookedAt: { type: Date }
    },

    // UTM Campaign Tracking (Module 1 Must-have 3)
    utm: {
      source: { type: String, default: 'direct' },
      medium: { type: String, default: 'none' },
      campaign: { type: String, default: 'none' },
      term: { type: String, default: '' },
      content: { type: String, default: '' },
      landingPage: { type: String, default: '/' }
    },

    // Team internal notes
    internalNotes: [
      {
        note: String,
        addedBy: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;