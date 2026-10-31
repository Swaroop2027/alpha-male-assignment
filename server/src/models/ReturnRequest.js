import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderId: { type: String, required: true },
    customer: {
      name: String,
      phone: String,
      email: String,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        quantity: Number,
        price: Number,
      },
    ],
    reason: {
      type: String,
      required: true,
      enum: [
        "Damaged or broken seal",
        "Wrong product delivered",
        "Expired product",
        "Quality not satisfactory",
        "Other",
      ],
    },
    description: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Picked up", "Refunded"],
      default: "Requested",
    },
    refundAmount: { type: Number, required: true },
    adminNotes: { type: String, default: "" },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
