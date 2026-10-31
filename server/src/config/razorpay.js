import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

let razorpayInstance = null;

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (key_id && key_secret && !key_id.includes("YourKeyIdHere")) {
  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  });
  console.log("💳 Razorpay Gateway initialized in TEST mode");
} else {
  console.log(
    "⚠️ Razorpay test credentials not configured in .env. Using mock payment engine.",
  );
}

export default razorpayInstance;
