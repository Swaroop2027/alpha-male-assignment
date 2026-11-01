import mongoose from "mongoose";
import dns from "node:dns";
import Product from "../models/Product.js";

// Resolve MongoDB Atlas SRV records using Google Public DNS (bypasses ISP/router SRV lookup issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/alphamale",
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Self-healing: Ensure Alpha Boss product has working high-resolution image in database
    try {
      await Product.updateMany(
        {
          slug: "alpha-boss",
          $or: [
            { images: { $size: 0 } },
            { images: { $regex: "photo-1550572017|photo-1584017911766" } },
          ],
        },
        {
          $set: {
            images: [
              "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80",
              "https://images.unsplash.com/photo-1633171031508-a8f26271e8aa?w=800&q=80",
            ],
          },
        },
      );
    } catch {
      // Non-blocking background self-heal
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
