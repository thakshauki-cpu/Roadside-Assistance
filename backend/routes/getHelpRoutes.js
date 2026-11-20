import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNearbyMechanics,
  getAssignment,
  respondToQuotation,
  payInspectionFee,
  getTracking,
  respondToRepairQuotation,
  payRepairFee,
  getCompletion,
  submitPayment,
  getSummary,
} from "../controller/getHelpController.js";
import {
  getCustomerReview,
  submitCustomerReview,
} from "../controller/reviewController.js";

const router = express.Router();

router.use(protect);

router.get("/:requestId/nearby-mechanics", getNearbyMechanics);
router.get("/:requestId/assignment", getAssignment);
router.post("/:requestId/quotation-response", respondToQuotation);
router.post("/:requestId/pay-inspection", payInspectionFee);
router.get("/:requestId/tracking", getTracking);
router.post("/:requestId/repair-quotation-response", respondToRepairQuotation);
router.post("/:requestId/pay-repair", payRepairFee);
router.get("/:requestId/completion", getCompletion);
router.post("/:requestId/payment", submitPayment);
router.get("/:requestId/summary", getSummary);
router.get("/:requestId/review", getCustomerReview);
router.post("/:requestId/review", submitCustomerReview);

export default router;
