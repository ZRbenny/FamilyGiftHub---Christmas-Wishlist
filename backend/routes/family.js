import express from "express";
import { authRequired } from "../middleware/auth.js";
import User from "../models/User.js";
import Gift from "../models/Gift.js";

const router = express.Router();

// GET /api/family/lists
// Returns all users + gifts for the current family
router.get("/family/lists", authRequired, async (req, res) => {
  try {
    const familyId = req.family._id;

    const users = await User.find({ familyId }).lean();
    const gifts = await Gift.find({ familyId }).lean();

    const usersById = {};
    users.forEach((u) => {
      usersById[u._id.toString()] = { _id: u._id, displayName: u.displayName };
    });

    const enrichedGifts = gifts.map((g) => {
      const copy = { ...g };
      if (g.reservedByUserId) {
        const info = usersById[g.reservedByUserId.toString()];
        if (info) {
          copy.reservedByUser = info;
        }
      }
      return copy;
    });

    res.json({
      users: users.map((u) => ({ _id: u._id, displayName: u.displayName })),
      gifts: enrichedGifts
    });
  } catch (err) {
    console.error("Family lists error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
