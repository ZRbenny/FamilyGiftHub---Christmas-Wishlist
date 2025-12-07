import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import giftsRoutes from "./routes/gifts.js";
import familyRoutes from "./routes/family.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/familygifthub";

console.log("MONGODB_URI from env:", process.env.MONGODB_URI);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
// These match the frontend:
// POST /api/families
// POST /api/auth/join
// GET  /api/me
// GET  /api/lists/me
// GET  /api/family/lists
// etc.
app.use("/api", authRoutes);
app.use("/api", giftsRoutes);
app.use("/api", familyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FamilyGiftHub API is running" });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
