
const API_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const notificationRequest = async (path = "", options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in to view your notifications.");
  }

  const response = await fetch(
    `${API_URL}/api/notifications${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Notification request failed."
    );
  }

  return data;
};

// Get notifications.
export const getNotifications = () =>
  notificationRequest();

// Mark one notification as read.
export const markNotificationAsRead = (id) =>
  notificationRequest(`/${id}/read`, {
    method: "PATCH",
  });

// Mark all notifications as read.
export const markAllNotificationsAsRead = () =>
  notificationRequest("/read-all", {
    method: "PATCH",
  });
