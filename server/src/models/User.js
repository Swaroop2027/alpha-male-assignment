import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Password query me by default leak na ho
    },
    role: {
      type: String,
      enum: ["Admin", "Operations", "Sales/Support", "Customer"],
      default: "Customer",
    },
    // Customer 360 CRM Data (Module 6)
    tags: [{ type: String }],
    teamNotes: [
      {
        note: String,
        addedBy: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    firstUtmSource: { type: String, default: "Direct" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Password auto-hash middleware before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
