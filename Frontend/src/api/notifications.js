const API_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const notificationRequest = async (path = "", options = {}) => {
  if (!API_URL) {
    throw new Error(
      "The backend URL is not configured. Set VITE_API_URL in Frontend/.env."
    );
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to view your notifications.");
  }

  const response = await fetch(`${API_URL}/api/notifications${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Notification request failed.");
  }

  return data;
};

export const getNotifications = () => notificationRequest();

export const markNotificationAsRead = (id) =>
  notificationRequest(`/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsAsRead = () =>
  notificationRequest("/mark-all-read", {
    method: "PATCH",
  });
