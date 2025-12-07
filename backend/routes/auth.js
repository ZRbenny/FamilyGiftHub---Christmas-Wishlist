import express from "express";
import Family from "../models/Family.js";
import User from "../models/User.js";
import { authRequired, generateToken } from "../middleware/auth.js";

const router = express.Router();

// Utility to generate random family code (6 uppercase letters/numbers)
function generateFamilyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/families
// Body: { name, displayName }
// Creates a family + first user + returns familyCode + token
router.post("/families", async (req, res) => {
  try {
    const { name, displayName } = req.body;
    if (!name || !displayName) {
      return res.status(400).json({ error: "name and displayName are required" });
    }

    let code = generateFamilyCode();
    for (let i = 0; i < 5; i += 1) {
      const existing = await Family.findOne({ code });
      if (!existing) break;
      code = generateFamilyCode();
    }

    const family = await Family.create({ name, code });
    const user = await User.create({ familyId: family._id, displayName });
    const token = generateToken(user);

    res.status(201).json({
      token,
      family: { _id: family._id, name: family.name, code: family.code },
      user: { _id: user._id, displayName: user.displayName }
    });
  } catch (err) {
    console.error("Create family error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/join
// Body: { familyCode, displayName }
// Adds new user, returns token
router.post("/auth/join", async (req, res) => {
  try {
    const { familyCode, displayName } = req.body;
    if (!familyCode || !displayName) {
      return res.status(400).json({ error: "familyCode and displayName are required" });
    }

    const family = await Family.findOne({ code: familyCode.trim().toUpperCase() });
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    const user = await User.create({ familyId: family._id, displayName });
    const token = generateToken(user);

    res.status(201).json({
      token,
      family: { _id: family._id, name: family.name, code: family.code },
      user: { _id: user._id, displayName: user.displayName }
    });
  } catch (err) {
    console.error("Join family error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/me
router.get("/me", authRequired, (req, res) => {
  res.json({
    user: { _id: req.user._id, displayName: req.user.displayName },
    family: { _id: req.family._id, name: req.family.name, code: req.family.code }
  });
});

export default router;
