
import express from "express";

import {
  adminLogin,
  getAdminMe,
  getAdminDashboard,
   getAdminMechanics,
  approveMechanic,
  rejectMechanic,
  getAdminCustomers,
getAdminCustomerById,
updateCustomerStatus,
getAdminMechanicById,
} from "../controller/adminController.js";
import { getAdminReviews } from "../controller/reviewController.js";

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
router.get("/reviews", getAdminReviews);

// Mechanic verification
router.get("/mechanics", getAdminMechanics);

router.patch("/mechanics/:id/approve", approveMechanic);

router.patch("/mechanics/:id/reject", rejectMechanic);

// Customer Management
router.get("/customers", getAdminCustomers);

router.get("/customers/:id", getAdminCustomerById);

router.patch("/customers/:id/status", updateCustomerStatus);

router.get("/mechanics/:id", getAdminMechanicById);


export default router;
