import express from "express";
import { authRequired } from "../middleware/auth.js";
import Gift from "../models/Gift.js";

const router = express.Router();

// GET /api/lists/me
// Returns current user's gifts
router.get("/lists/me", authRequired, async (req, res) => {
  try {
    const gifts = await Gift.find({
      familyId: req.family._id,
      ownerUserId: req.user._id
    }).sort({ createdAt: -1 });
    res.json(gifts);
  } catch (err) {
    console.error("Get my list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/lists/me/items
// Create gift for current user
router.post("/lists/me/items", authRequired, async (req, res) => {
  try {
    const { title, description, link, price, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const gift = await Gift.create({
      familyId: req.family._id,
      ownerUserId: req.user._id,
      title,
      description,
      link,
      price,
      priority: priority || "medium"
    });

    res.status(201).json(gift);
  } catch (err) {
    console.error("Create gift error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/gifts/:id
// Edit gift (only owner can edit)
router.patch("/gifts/:id", authRequired, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: "Gift not found" });

    if (!gift.ownerUserId.equals(req.user._id)) {
      return res.status(403).json({ error: "Not allowed to edit this gift" });
    }

    const allowedFields = ["title", "description", "link", "price", "priority"];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        gift[f] = req.body[f];
      }
    });

    await gift.save();
    res.json(gift);
  } catch (err) {
    console.error("Edit gift error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/gifts/:id
// Delete gift (only owner can delete)
router.delete("/gifts/:id", authRequired, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: "Gift not found" });

    if (!gift.ownerUserId.equals(req.user._id)) {
      return res.status(403).json({ error: "Not allowed to delete this gift" });
    }

    await Gift.deleteOne({ _id: gift._id });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete gift error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/gifts/:id/reserve
// Reserve gift for current user (cannot reserve own gift)
router.post("/gifts/:id/reserve", authRequired, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: "Gift not found" });

    if (!gift.familyId.equals(req.family._id)) {
      return res.status(403).json({ error: "Gift is not in your family" });
    }

    if (gift.ownerUserId.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot reserve your own gift" });
    }

    if (gift.reservedByUserId && !gift.reservedByUserId.equals(req.user._id)) {
      return res.status(400).json({ error: "Gift already reserved by someone else" });
    }

    gift.reservedByUserId = req.user._id;
    await gift.save();
    res.json(gift);
  } catch (err) {
    console.error("Reserve gift error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/gifts/:id/unreserve
// Remove reservation (only reserver can unreserve)
router.post("/gifts/:id/unreserve", authRequired, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: "Gift not found" });

    if (!gift.familyId.equals(req.family._id)) {
      return res.status(403).json({ error: "Gift is not in your family" });
    }

    if (!gift.reservedByUserId) {
      return res.status(400).json({ error: "Gift is not reserved" });
    }

    if (!gift.reservedByUserId.equals(req.user._id)) {
      return res.status(403).json({ error: "Only the reserver can unreserve this gift" });
    }

    gift.reservedByUserId = null;
    await gift.save();
    res.json(gift);
  } catch (err) {
    console.error("Unreserve gift error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
