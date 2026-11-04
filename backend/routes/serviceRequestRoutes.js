
import express from "express";
import {
  createServiceRequest,
  getPendingServiceRequests,
} from "../controller/serviceRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireMechanic } from "../middleware/mechanicMiddleware.js";

const router = express.Router();

router.get(
  "/mechanic/pending",
  protect,
  requireMechanic,
  getPendingServiceRequests
);

// Create a new service request
router.post("/", protect, createServiceRequest);

export default router;
