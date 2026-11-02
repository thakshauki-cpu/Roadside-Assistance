
import express from "express";

import {
  adminLogin,
  getAdminMe,
  getAdminDashboard,
   getAdminMechanics,
  approveMechanic,
  rejectMechanic,
} from "../controller/adminController.js";

import {
  protectAdmin,
} from "../middleware/adminMiddleware.js";

const router = express.Router();

// Admin Login
router.post("/login", adminLogin);

// Protect all routes below
router.use(protectAdmin);

// Admin Profile
router.get("/me", getAdminMe);

// Admin Dashboard
router.get("/dashboard", getAdminDashboard);

// Mechanic verification
router.get("/mechanics", getAdminMechanics);

router.patch("/mechanics/:id/approve", approveMechanic);

router.patch("/mechanics/:id/reject", rejectMechanic);

export default router;
