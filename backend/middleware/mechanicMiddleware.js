import User from "../models/User.js";

export const requireMechanic = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select("role");

    if (!user) {
      return res.status(401).json({
        message: "Your account could not be found. Please log in again.",
      });
    }

    if (user.role !== "mechanic") {
      return res.status(403).json({
        message: "Mechanic access only.",
      });
    }

    return next();
  } catch (error) {
    console.error("Mechanic authorization error:", error);
    return res.status(500).json({
      message: "Unable to verify mechanic access.",
    });
  }
};
