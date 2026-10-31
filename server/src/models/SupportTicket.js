import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true, // E.g. TKT-1001
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "In progress", "Closed"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["Customer", "SupportAgent"],
          required: true,
        },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        isInternal: { type: Boolean, default: false }, // Staff only internal note
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
