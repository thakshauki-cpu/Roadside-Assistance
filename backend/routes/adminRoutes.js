
import express from "express";

import {
  adminLogin,
  getAdminMe,
  getAdminDashboard,
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

export default router;
