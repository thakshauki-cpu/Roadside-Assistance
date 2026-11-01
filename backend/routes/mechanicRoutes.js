
import express from "express";
import { getMechanics } from "../controller/mechanicController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get mechanics
router.get("/", protect, getMechanics);

export default router;

