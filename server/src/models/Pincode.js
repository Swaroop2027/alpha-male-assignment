import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    stateCode: { type: String, required: true }, // e.g. '27' for Maharashtra (GST invoice state matching)
    isServiceable: { type: Boolean, default: true },
    codAvailable: { type: Boolean, default: true },
    deliveryDays: { type: Number, default: 3 }, // E.g., 3 days -> Delivery by [Day]
  },
  { timestamps: true },
);

const Pincode = mongoose.model("Pincode", pincodeSchema);
export default Pincode;
