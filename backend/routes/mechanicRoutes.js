import express from "express";
import {
  getMechanics,
  getOwnMechanicProfile,
  updateOwnMechanicAvailability,
  getMechanicDashboardStats,
} from "../controller/mechanicController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireMechanic } from "../middleware/mechanicMiddleware.js";
import { getMechanicReviews } from "../controller/reviewController.js";

const router = express.Router();

// Get mechanics
router.get("/", protect, getMechanics);
router.get("/me", protect, requireMechanic, getOwnMechanicProfile);
router.get("/me/dashboard-stats", protect, requireMechanic, getMechanicDashboardStats);
router.patch(
  "/me/availability",
  protect,
  requireMechanic,
  updateOwnMechanicAvailability
);
router.get("/me/reviews", protect, requireMechanic, getMechanicReviews);

export default router;
