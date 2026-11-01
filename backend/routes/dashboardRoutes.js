import express from "express";
import { getDashboardData } from "../controller/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";    //verift jwt token

const router = express.Router();

// Customer Dashboard API
router.get("/", protect, getDashboardData);   //fetch dashboard data

export default router;
