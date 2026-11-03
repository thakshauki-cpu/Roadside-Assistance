// Temporary Notification Mock Data

export const getNotifications = async (req, res) => {
  try {
    const notifications = [
      {
        _id: "1",
        title: "Mechanic Assigned",
        message: "A mechanic has been assigned to your request.",
        type: "assigned",
        isRead: false,
        createdAt: new Date(),
      },
      {
        _id: "2",
        title: "Mechanic On The Way",
        message: "Your mechanic is on the way to your location.",
        type: "on_the_way",
        isRead: false,
        createdAt: new Date(),
      },
      {
        _id: "3",
        title: "Service Completed",
        message: "Your roadside assistance service has been completed.",
        type: "completed",
        isRead: true,
        createdAt: new Date(),
      },
      {
        _id: "4",
        title: "Request Submitted",
        message: "Your roadside assistance request was submitted successfully.",
        type: "request",
        isRead: true,
        createdAt: new Date(),
      },
    ];

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
};