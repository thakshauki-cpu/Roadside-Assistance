import express from "express";
import {
  acceptServiceRequest,
  createServiceRequest,
  retryServiceRequest,
  getPendingServiceRequests,
  getAssignedServiceRequests,
  rejectServiceRequest,
  submitInspectionFee,
  mechanicStartTravel,
  updateMechanicLocation,
  mechanicMarkArrived,
  mechanicStartInspection,
  mechanicCompleteInspection,
  submitRepairQuotation,
  mechanicCompleteRepair,
} from "../controller/serviceRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireMechanic } from "../middleware/mechanicMiddleware.js";

const router = express.Router();

// Mechanic routes
router.get(
  "/mechanic/pending",
  protect,
  requireMechanic,
  getPendingServiceRequests
);

router.get(
  "/mechanic/assigned",
  protect,
  requireMechanic,
  getAssignedServiceRequests
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

router.post(
  "/mechanic/:requestId/inspection-fee",
  protect,
  requireMechanic,
  submitInspectionFee
);

router.patch(
  "/mechanic/:requestId/on-the-way",
  protect,
  requireMechanic,
  mechanicStartTravel
);

router.patch(
  "/mechanic/:requestId/location",
  protect,
  requireMechanic,
  updateMechanicLocation
);

router.patch(
  "/mechanic/:requestId/arrived",
  protect,
  requireMechanic,
  mechanicMarkArrived
);

router.patch(
  "/mechanic/:requestId/start-inspection",
  protect,
  requireMechanic,
  mechanicStartInspection
);

router.patch(
  "/mechanic/:requestId/complete-inspection",
  protect,
  requireMechanic,
  mechanicCompleteInspection
);

router.post(
  "/mechanic/:requestId/repair-quotation",
  protect,
  requireMechanic,
  submitRepairQuotation
);

router.patch(
  "/mechanic/:requestId/complete-repair",
  protect,
  requireMechanic,
  mechanicCompleteRepair
);

// Customer routes
// Create a new service request
router.post("/", protect, createServiceRequest);
router.post("/:requestId/retry", protect, retryServiceRequest);

export default router;
