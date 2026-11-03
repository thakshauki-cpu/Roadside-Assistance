import express from "express";
import { getNotifications } from "../controller/notificationController.js";

const router = express.Router();

// Get customer notifications
router.get("/", getNotifications);

export default router;