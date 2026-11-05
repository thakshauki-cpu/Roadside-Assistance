import User from "../models/User.js";
import MechanicProfile from "../models/MechanicProfile.js";

const pendingApprovalMessage =
  "Your account is waiting for admin verification. You can access your dashboard after approval.";

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

    const profile = await MechanicProfile.findOne({ user: req.user }).select(
      "isVerified verificationStatus"
    );

    if (!profile) {
      return res.status(404).json({
        message: "Mechanic profile not found.",
      });
    }

    if (profile.verificationStatus === "pending") {
      return res.status(403).json({
        message: pendingApprovalMessage,
      });
    }

    if (profile.verificationStatus === "rejected") {
      return res.status(403).json({
        message:
          "Your mechanic account was rejected. Please contact support for more information.",
      });
    }

    if (
      profile.verificationStatus !== "approved" ||
      profile.isVerified !== true
    ) {
      return res.status(403).json({
        message: "Your account has not been approved by an administrator.",
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
