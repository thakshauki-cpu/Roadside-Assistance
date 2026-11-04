
import express from "express";
import {
  getMechanics,
  getOwnMechanicProfile,
  updateOwnMechanicAvailability,
} from "../controller/mechanicController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireMechanic } from "../middleware/mechanicMiddleware.js";

const router = express.Router();

// Get mechanics
router.get("/", protect, getMechanics);
router.get("/me", protect, requireMechanic, getOwnMechanicProfile);
router.patch(
  "/me/availability",
  protect,
  requireMechanic,
  updateOwnMechanicAvailability
);

export default router;
