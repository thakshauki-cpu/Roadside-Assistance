const API_URL = import.meta.env.VITE_API_URL;

const request = async (path, options = {}) => {
  if (!API_URL) {
    throw new Error("The backend URL is not configured. Set VITE_API_URL in Frontend/.env.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please log in again to continue.");
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
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
    throw new Error(data.message || "Unable to process your account request.");
  }

  return data;
};

export const getCustomerProfile = () => request("/api/profile");

export const updateCustomerProfile = (profile) =>
  request("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

export const getCustomerVehicles = () => request("/api/vehicles");

export const createCustomerVehicle = (vehicle) =>
  request("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(vehicle),
  });

export const deleteCustomerVehicle = (vehicleId) =>
  request(`/api/vehicles/${encodeURIComponent(vehicleId)}`, {
    method: "DELETE",
  });
