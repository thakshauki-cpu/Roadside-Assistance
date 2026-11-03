const API_URL = import.meta.env.VITE_API_URL;

// Get notifications from the backend
export const getNotifications = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/notifications`, {
    method: "GET",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch notifications.");
  }

  return data;
};