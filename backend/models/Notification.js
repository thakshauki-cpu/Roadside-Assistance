import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The recipient user (customer or mechanic)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // The sender user (optional, can be system or customer/mechanic)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Associated service request
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      index: true,
    },

    eventKey: {
      type: String,
      default: null,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "inspection_paid",
        "mechanic_notified",
        "on_the_way",
        "arrived",
        "inspection_started",
        "inspection_completed",
        "repair_quotation_submitted",
        "repair_accepted",
        "repair_rejected",
        "repair_started",
        "repair_completed",
        "repair_paid",
        "request",
        "assigned",
        "system",
      ],
      default: "system",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to help prevent duplicate notifications for the same event
notificationSchema.index(
  { recipient: 1, serviceRequest: 1, type: 1 },
  { background: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
