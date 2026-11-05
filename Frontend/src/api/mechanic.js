const API_URL = import.meta.env.VITE_API_URL;

const request = async (path, options = {}) => {
  if (!API_URL) {
    throw new Error(
      "The backend URL is not configured. Set VITE_API_URL in Frontend/.env."
    );
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please log in again to continue.");
  }

  let response;
  try {
    const headers = new Headers(options.headers);
    headers.set("Authorization", ["Bearer", token].join(" "));
    if (options.body) {
      headers.set("Content-Type", "application/json");
    }

    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot connect to the backend at ${API_URL}.`, {
        cause: error,
      });
    }
    throw error;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Unable to process the mechanic request.");
  }

  return data;
};

export const getMechanicProfile = () => request("/api/mechanics/me");

export const updateMechanicAvailability = (isAvailable) =>
  request("/api/mechanics/me/availability", {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });

export const getPendingServiceRequests = () =>
  request("/api/service-requests/mechanic/pending");

export const acceptServiceRequest = (requestId) =>
  request(`/api/service-requests/mechanic/${encodeURIComponent(requestId)}/accept`, {
    method: "PATCH",
  });

export const rejectServiceRequest = (requestId) =>
  request(`/api/service-requests/mechanic/${encodeURIComponent(requestId)}/reject`, {
    method: "PATCH",
  });
