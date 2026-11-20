import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controller/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/mark-all-read", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

export default router;
