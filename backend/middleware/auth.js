import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Family from "../models/Family.js";

export async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const family = await Family.findById(user.familyId);
    if (!family) {
      return res.status(401).json({ error: "Family not found" });
    }

    req.user = user;
    req.family = family;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function generateToken(user) {
  const payload = { userId: user._id.toString(), familyId: user.familyId.toString() };
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}
