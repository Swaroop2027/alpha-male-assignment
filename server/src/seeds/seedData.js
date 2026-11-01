import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Pincode from "../models/Pincode.js";
import Coupon from "../models/Coupon.js";
import LandingPage from "../models/LandingPage.js";
import Lead from "../models/Lead.js";
import AbandonedCart from "../models/AbandonedCart.js";

// Resolve MongoDB Atlas SRV records using Google Public DNS (bypasses ISP/router SRV lookup issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const seedAllData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/alphamale",
    );
    console.log("🔄 Cleaning old database collections...");

    await User.deleteMany({});
    await Product.deleteMany({});
    await Pincode.deleteMany({});
    await Coupon.deleteMany({});
    await LandingPage.deleteMany({});
    await Lead.deleteMany({});
    await AbandonedCart.deleteMany({});

    console.log(
      "🌱 Seeding Users (Admin, Operations, Sales/Support, Customer)...",
    );
    // Note: User.pre('save') will automatically hash these passwords!
    const users = await User.create([
      {
        name: "Alpha Admin",
        email: "admin@alphamale.co.in",
        phone: "9876543210",
        password: "Admin@123",
        role: "Admin",
        tags: ["Executive", "Superuser"],
      },
      {
        name: "Rajesh Operations",
        email: "ops@alphamale.co.in",
        phone: "9876543211",
        password: "Ops@123",
        role: "Operations",
        tags: ["Fulfillment", "Warehouse"],
      },
      {
        name: "Pooja Sales & Support",
        email: "sales@alphamale.co.in",
        phone: "9876543212",
        password: "Sales@123",
        role: "Sales/Support",
        tags: ["Support", "CRM"],
      },
      {
        name: "Vikram Malhotra",
        email: "customer@alphamale.co.in",
        phone: "9876543213",
        password: "Customer@123",
        role: "Customer",
        tags: ["VIP", "Repeat Buyer"],
        firstUtmSource: "instagram_reels",
      },
    ]);

    console.log("🌱 Seeding the 4 Mandatory Products...");
    const products = await Product.create([
      {
        title: "Alpha Bold - High Potency Testosterone & Vitality Booster",
        slug: "alpha-bold",
        tagline: "Ignite Maximum Stamina, Energy & Peak Athletic Drive",
        description:
          "Alpha Bold is our flagship clinical-grade formula designed for driven men. Packed with pure Himalayan Shilajit, KSM-66 Ashwagandha, Gokshura, and Safed Musli, it optimizes natural vitality, boosts endurance, and accelerates muscle recovery without jitters or crashes.",
        images: [
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
          "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=800&q=80",
        ],
        mrp: 1999,
        price: 1399,
        hsnCode: "21069099",
        stock: 120,
        lowStockThreshold: 20,
        sku: "AM-PROD-BOLD",
        weightGrams: 200,
        benefits: [
          "Enhances daily energy, stamina & physical drive",
          "Supports lean muscle growth and workout recovery",
          "Balances cortisol (stress hormone) with KSM-66 Ashwagandha",
          "100% Ayurvedic, Non-GMO & FSSAI Certified",
        ],
        ingredients: [
          "Purified Himalayan Shilajit (75% Fulvic Acid) - 500mg",
          "KSM-66 Organic Ashwagandha - 300mg",
          "Safed Musli Extract (40% Saponins) - 200mg",
          "Gokshura (Tribulus Terrestris) - 250mg",
          "BioPerine (Black Pepper Extract) for 300% enhanced absorption - 10mg",
        ],
        faqs: [
          {
            question: "How do I take Alpha Bold?",
            answer:
              "Take 2 capsules daily after breakfast or 30 minutes before workout with a glass of warm milk or water.",
          },
          {
            question: "Are there any side effects?",
            answer:
              "No. Alpha Bold is made from 100% standardized herbal extracts and contains zero heavy metals, steroids, or harmful additives.",
          },
          {
            question: "How long until I see results?",
            answer:
              "Noticeable energy surge within 7–10 days. Sustained physical stamina and endurance peak between 4 to 8 weeks.",
          },
        ],
      },
      {
        title: "Alpha Boss - Daily Performance Multivitamin & Focus Fuel",
        slug: "alpha-boss",
        tagline: "All-Day Mental Clarity, Immunity & Zero Mid-Day Fatigue",
        description:
          "Alpha Boss delivers 32 essential vitamins, chelated minerals, brain-boosting nootropics (Brahmi & Ginkgo Biloba), and potent antioxidants tailored specifically for high-stress executives and ambitious performers.",
        images: [
          "https://images.unsplash.com/photo-1664216294573-b28282de564b?w=800&q=80",
          "https://images.unsplash.com/photo-1633171031508-a8f26271e8aa?w=800&q=80",
        ],
        mrp: 1499,
        price: 999,
        hsnCode: "21069099",
        stock: 150,
        lowStockThreshold: 25,
        sku: "AM-PROD-BOSS",
        weightGrams: 180,
        benefits: [
          "Eliminates 3 PM brain fog and mental burnout",
          "32 Essential bio-available vitamins & minerals",
          "Boosts natural immune defense with Zinc & Vitamin C",
          "Supports cardiovascular health and micro-circulation",
        ],
        ingredients: [
          "Vitamin Complex (A, B-Complex, C, D3, K2) - 100% RDA",
          "Chelated Zinc & Magnesium Glycinate - 150mg",
          "Brahmi (Bacopa Monnieri) - 150mg",
          "Panax Ginseng Extract - 100mg",
        ],
        faqs: [
          {
            question: "Can I take Alpha Boss alongside Alpha Bold?",
            answer:
              "Yes! Alpha Boss acts as the micronutrient foundation while Alpha Bold targets stamina and vitality.",
          },
        ],
      },
      {
        title: "Alpha Legend - Deep Sleep, Night Recovery & GH Support",
        slug: "alpha-legend",
        tagline:
          "Deep Restorative REM Sleep & Overnight Cellular Muscle Repair",
        description:
          "Alpha Legend is a scientifically formulated night-time relaxation elixir designed to induce deep REM sleep, lower nervous tension with Chamomile and Melatonin, and release natural growth factors for maximum overnight recovery.",
        images: [
          "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80",
        ],
        mrp: 1799,
        price: 1199,
        hsnCode: "21069099",
        stock: 90,
        lowStockThreshold: 15,
        sku: "AM-PROD-LEGEND",
        weightGrams: 220,
        benefits: [
          "Fall asleep 40% faster without grogginess",
          "Extends deep delta sleep cycles for muscle repair",
          "Reduces nighttime cortisol and restless leg sensations",
        ],
        ingredients: [
          "L-Theanine - 200mg",
          "Valerian Root Extract - 150mg",
          "Magnesium Bisglycinate - 300mg",
          "Tagara & Chamomile - 100mg",
        ],
        faqs: [
          {
            question: "Is it habit-forming?",
            answer:
              "Alpha Legend is 100% non-habit forming and melatonin-balanced so you wake up refreshed, not groggy.",
          },
        ],
      },
      {
        title: "Alpha Icon - Premium Whey Isolate & Hydrolyzed Peptides",
        slug: "alpha-icon",
        tagline: "Ultra-Pure 28g Protein Per Scoop with Digestive Enzymes",
        description:
          "Alpha Icon represents the absolute pinnacle of sports nutrition. Micro-filtered cross-flow Whey Isolate delivering 28g pure protein, 6.5g BCAAs, zero added sugar, and DigeZyme enzymes for flawless digestion and zero bloating.",
        images: [
          "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80",
        ],
        mrp: 3499,
        price: 2499,
        hsnCode: "21069099",
        stock: 60,
        lowStockThreshold: 10,
        sku: "AM-PROD-ICON",
        weightGrams: 1000,
        benefits: [
          "28g pure protein with 6.5g BCAAs per scoop",
          "Zero bloating with DigeZyme digestive enzyme complex",
          "Cold-processed micro-filtration with 0g added sugar",
        ],
        ingredients: [
          "Cross-Flow Microfiltered Whey Protein Isolate - 30g",
          "DigeZyme Multi-Enzyme Complex - 50mg",
          "Natural Belgian Cocoa & Stevia Leaf Extract",
        ],
        faqs: [
          {
            question: "Is Alpha Icon lactose-free?",
            answer:
              "Alpha Icon is 99% lactose-free due to isolate processing and easily tolerated by sensitive stomachs.",
          },
        ],
      },
    ]);

    console.log(
      "🌱 Seeding Pincodes (Intra-state Maharashtra & Inter-state)...",
    );
    await Pincode.create([
      // Intra-state (Maharashtra - State Code 27 -> CGST + SGST)
      {
        pincode: "400001",
        city: "Mumbai",
        state: "Maharashtra",
        stateCode: "27",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 2,
      },
      {
        pincode: "400069",
        city: "Mumbai",
        state: "Maharashtra",
        stateCode: "27",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 1,
      },
      {
        pincode: "411001",
        city: "Pune",
        state: "Maharashtra",
        stateCode: "27",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 2,
      },
      {
        pincode: "440001",
        city: "Nagpur",
        state: "Maharashtra",
        stateCode: "27",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 3,
      },

      // Inter-state (Outside Maharashtra -> IGST)
      {
        pincode: "110001",
        city: "New Delhi",
        state: "Delhi",
        stateCode: "07",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 3,
      },
      {
        pincode: "560001",
        city: "Bengaluru",
        state: "Karnataka",
        stateCode: "29",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 3,
      },
      {
        pincode: "500001",
        city: "Hyderabad",
        state: "Telangana",
        stateCode: "36",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 3,
      },
      {
        pincode: "600001",
        city: "Chennai",
        state: "Tamil Nadu",
        stateCode: "33",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 4,
      },
      {
        pincode: "700001",
        city: "Kolkata",
        state: "West Bengal",
        stateCode: "19",
        isServiceable: true,
        codAvailable: true,
        deliveryDays: 4,
      },

      // Unserviceable pincode demo
      {
        pincode: "999999",
        city: "Remote Valley",
        state: "Jammu & Kashmir",
        stateCode: "01",
        isServiceable: false,
        codAvailable: false,
        deliveryDays: 0,
      },
    ]);

    console.log("🌱 Seeding Coupons...");
    await Coupon.create([
      {
        code: "ALPHA20",
        discountType: "percentage",
        discountValue: 20,
        minOrderValue: 999,
        maxDiscountAmount: 500,
        expiryDate: new Date("2028-12-31"),
        usageLimit: 1000,
      },
      {
        code: "FLAT300",
        discountType: "flat",
        discountValue: 300,
        minOrderValue: 1499,
        expiryDate: new Date("2028-12-31"),
        usageLimit: 500,
      },
      {
        code: "POWER10",
        discountType: "percentage",
        discountValue: 10,
        minOrderValue: 499,
        maxDiscountAmount: 300,
        expiryDate: new Date("2028-12-31"),
        usageLimit: 2000,
      },
    ]);

    console.log("🌱 Seeding Dynamic Campaign Landing Page (/lp/alpha-bold)...");
    await LandingPage.create({
      slug: "alpha-bold",
      product: products[0]._id, // Alpha Bold
      headline:
        "Unleash Your Alpha: 2X Stamina, Lean Strength & Unstoppable Drive",
      subheadline:
        "India’s #1 Clinically Formulated Testosterone Booster with 75% Pure Fulvic Himalayan Shilajit & KSM-66.",
      bannerImage:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80",
      offerText:
        "⚡ LIMITED TIME OFFER: Get Flat ₹600 OFF + Free Shaker + Cash on Delivery Available",
      benefits: [
        {
          icon: "Zap",
          title: "Explosive Stamina & Energy",
          description:
            "Experience surging physical endurance throughout strenuous work and intense workouts.",
        },
        {
          icon: "Shield",
          title: "Faster Muscle Recovery",
          description:
            "Reduces post-workout soreness and elevates free testosterone naturally.",
        },
        {
          icon: "Flame",
          title: "Heightened Mental Focus",
          description:
            "Lowers cortisol-induced stress and sharpens executive cognitive drive.",
        },
      ],
      ingredients: [
        {
          name: "Pure Himalayan Shilajit",
          potency: "500mg (75% Fulvic Acid)",
          description:
            "Harvested from 18,000 ft altitude for pure mineral bio-availability.",
        },
        {
          name: "KSM-66 Ashwagandha",
          potency: "300mg Standardized",
          description:
            "Gold-standard full-spectrum root extract clinically proven to boost T-levels.",
        },
        {
          name: "Safed Musli Extract",
          potency: "200mg (40% Saponins)",
          description:
            "Traditional rasayana herb known to optimize sexual wellness and vigor.",
        },
      ],
      faqs: [
        {
          question: "Is Cash on Delivery (COD) available for Alpha Bold?",
          answer:
            "Yes! We offer 100% Cash on Delivery across 20,000+ Indian pincodes.",
        },
        {
          question: "Is discreet packaging guaranteed?",
          answer:
            "Absolutely. Every order is shipped in an unbranded, tamper-evident courier box with no product name visible from outside.",
        },
      ],
      testimonials: [
        {
          customerName: "Aman Sharma, Delhi (Sample)",
          rating: 5,
          review:
            "My workout endurance doubled in 3 weeks. Genuine Ayurvedic ingredients without any side effects. (Sample Review)",
          isSample: true,
        },
        {
          customerName: "Kunal Deshmukh, Pune (Sample)",
          rating: 5,
          review:
            "Energy slump at 4 PM is gone completely. Delivered in just 2 days in Pune with COD. (Sample Review)",
          isSample: true,
        },
      ],
      ctaButtonText: "Order Alpha Bold Now - Pay on Delivery",
    });

    console.log("🌱 Seeding Sample Leads & Abandoned Carts for CRM testing...");
    await Lead.create([
      {
        name: "Rohan Mehra",
        phone: "9988776655",
        email: "rohan.mehra@gmail.com",
        interestedProduct: products[0]._id,
        status: "New",
        assignedTo: users[2]._id, // Assigned to Sales Pooja
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        utmSource: "google_search_ad",
        notes: [
          {
            note: "Requested a callback regarding dosage for gym beginners.",
            addedBy: "Pooja Sales",
          },
        ],
      },
      {
        name: "Siddharth Roy",
        phone: "9811223344",
        email: "siddharth@yahoo.com",
        interestedProduct: products[3]._id,
        status: "Interested",
        assignedTo: users[2]._id,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        utmSource: "facebook_feed",
        notes: [
          {
            note: "Interested in Alpha Icon Whey Isolate; asking for combo discount with Alpha Bold.",
            addedBy: "Pooja Sales",
          },
        ],
      },
    ]);

    await AbandonedCart.create([
      {
        phone: "9899001122",
        customerName: "Gaurav Khanna",
        email: "gaurav.k@gmail.com",
        items: [
          {
            product: products[0]._id,
            title: products[0].title,
            price: products[0].price,
            quantity: 1,
            image: products[0].images[0],
          },
        ],
        cartTotal: products[0].price,
        utm: {
          source: "instagram_story",
          medium: "cpc",
          campaign: "alpha_bold_launch",
        },
        followUpStatus: "Pending",
        isRecovered: false,
      },
    ]);

    console.log("✅ ALL SEED DATA POPULATED SUCCESSFULLY!");
    console.log("----------------------------------------------------");
    console.log("Test Accounts created:");
    console.log("👑 Admin:         admin@alphamale.co.in     / Admin@123");
    console.log("📦 Operations:    ops@alphamale.co.in       / Ops@123");
    console.log("💼 Sales/Support: sales@alphamale.co.in     / Sales@123");
    console.log("👤 Customer:      customer@alphamale.co.in  / Customer@123");
    console.log("----------------------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedAllData();