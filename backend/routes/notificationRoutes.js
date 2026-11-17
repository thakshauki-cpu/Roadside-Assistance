
import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controller/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all notification routes.
router.use(protect);

// Get all notifications.
router.get("/", getNotifications);

// Mark all notifications as read.
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read.
router.patch("/:id/read", markNotificationAsRead);

export default router;
