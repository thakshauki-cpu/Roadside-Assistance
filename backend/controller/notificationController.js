
import Notification from "../models/Notification.js";
import ServiceRequest from "../models/ServiceRequest.js";

// Build notifications from real ServiceRequest records.
const getEventsForRequest = (request) => {
  const events = [
    {
      eventKey: `${request._id}:request-created`,
      type: "request",
      title: "Request Submitted",
      message: `Your roadside assistance request for ${request.problem} was submitted successfully.`,
      createdAt: request.createdAt,
    },
  ];

  const statusEvents = {
    assigned: {
      type: "assigned",
      title: "Mechanic Assigned",
      message: "A mechanic has been assigned to your service request.",
    },
    accepted: {
      type: "assigned",
      title: "Mechanic Assigned",
      message: "Your selected mechanic has accepted the service request.",
    },
    on_the_way: {
      type: "on_the_way",
      title: "Mechanic On The Way",
      message: "Your mechanic is on the way to your location.",
    },
    in_progress: {
      type: "in_progress",
      title: "Service In Progress",
      message: "Your roadside assistance service is now in progress.",
    },
    completed: {
      type: "completed",
      title: "Service Completed",
      message: "Your roadside assistance service has been completed.",
    },
    cancelled: {
      type: "cancelled",
      title: "Request Cancelled",
      message: "Your roadside assistance request has been cancelled.",
    },
  };

  const statusEvent = statusEvents[request.status];

  if (statusEvent) {
    events.push({
      eventKey: `${request._id}:status:${request.status}`,
      ...statusEvent,
      createdAt: request.updatedAt || request.createdAt,
    });
  }

  return events;
};

// Get customer notifications.
export const getNotifications = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      customer: req.user,
    })
      .select("problem status createdAt updatedAt")
      .sort({ createdAt: -1 });

    const notificationRecords = requests.flatMap((request) =>
      getEventsForRequest(request).map((event) => ({
        customer: req.user,
        serviceRequest: request._id,
        ...event,
      }))
    );

    if (notificationRecords.length) {
      await Notification.bulkWrite(
        notificationRecords.map((record) => ({
          updateOne: {
            filter: {
              customer: record.customer,
              eventKey: record.eventKey,
            },
            update: { $setOnInsert: record },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }

    const notifications = await Notification.find({
      customer: req.user,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter(
        (item) => !item.isRead
      ).length,
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

// Mark one notification as read.
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: req.user,
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

// Mark all notifications as read.
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        customer: req.user,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};
