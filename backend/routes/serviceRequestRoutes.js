
import express from "express";
import {
  acceptServiceRequest,
  createServiceRequest,
  getPendingServiceRequests,
  rejectServiceRequest,
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
router.patch(
  "/mechanic/:requestId/accept",
  protect,
  requireMechanic,
  acceptServiceRequest
);
router.patch(
  "/mechanic/:requestId/reject",
  protect,
  requireMechanic,
  rejectServiceRequest
);

// Create a new service request
router.post("/", protect, createServiceRequest);

export default router;
