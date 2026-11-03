import express from "express";
import {
  createCustomerVehicle,
  deleteCustomerVehicle,
  getCustomerVehicles,
  getProfile,
  updateProfile,
} from "../controller/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/vehicles", protect, getCustomerVehicles);
router.post("/vehicles", protect, createCustomerVehicle);
router.delete("/vehicles/:vehicleId", protect, deleteCustomerVehicle);

export default router;
