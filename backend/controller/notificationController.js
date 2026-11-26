import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { emitToUser } from "../socket.js";

// Helper function to create notification with duplicate check
export const createWorkflowNotification = async ({
  recipient,
  sender = null,
  serviceRequest = null,
  title,
  message,
  type,
}) => {
  try {
    if (!recipient || !title || !message) return null;

    // Prevent duplicate notification for the same event
    if (serviceRequest && type) {
      const existing = await Notification.findOne({
        recipient,
        serviceRequest,
        type,
      });
      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      sender,
      serviceRequest,
      title,
      message,
      type,
      isRead: false,
    });

    // Real-time socket emission to the recipient user
    emitToUser(recipient, "notification_created", notification);
    emitToUser(recipient, "new_notification", notification);

    return notification;
  } catch (error) {
    console.error("Create workflow notification error:", error);
    return null;
  }
};

// Get notifications for current user (customer or mechanic)
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user;

    const notifications = await Notification.find(
      { recipient: userId }
    )
      .populate("sender", "fullName role")
      .populate("serviceRequest", "problem status location")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
};

// Mark single notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [{ recipient: req.user }, { customer: req.user }],
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    emitToUser(req.user, "notification_read", {
      notificationId: notification._id,
      allRead: false,
    });

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// Mark all notifications as read for current user
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user }, { customer: req.user }],
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    emitToUser(req.user, "notification_read", {
      allRead: true,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read.",
    });
  }
};
