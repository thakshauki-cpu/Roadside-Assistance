
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    eventKey: {
      type: String,
      required: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "request",
        "assigned",
        "on_the_way",
        "in_progress",
        "completed",
        "cancelled",
      ],
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate notifications.
notificationSchema.index(
  { customer: 1, eventKey: 1 },
  { unique: true }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
