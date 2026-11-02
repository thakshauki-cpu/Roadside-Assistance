
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin token required.",
      });
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      throw new Error("ADMIN_JWT_SECRET is missing in .env");
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET
    );

    if (decoded.role !== "admin" || !decoded.id) {
      return res.status(403).json({
        message: "Admin access only.",
      });
    }

    const admin = await Admin.findById(decoded.id)
      .select("-password");

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        message: "Admin account not found or inactive.",
      });
    }

    req.admin = admin;

    next();

  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired Admin token.",
    });
  }
};
