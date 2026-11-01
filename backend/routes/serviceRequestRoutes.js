
import express from "express";
import { createServiceRequest } from "../controller/serviceRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new service request
router.post("/", protect, createServiceRequest);

export default router;
