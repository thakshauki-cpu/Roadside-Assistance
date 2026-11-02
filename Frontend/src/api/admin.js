const API_URL = import.meta.env.VITE_API_URL;

// Admin Login
export const adminLogin = async (loginData) => {
  const response = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Admin login failed");
  }

  return data;
};

// Get logged-in Admin
export const getAdminMe = async () => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(`${API_URL}/api/admin/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to verify admin");
  }

  return data;
};

//dashboard
export const getAdminDashboard = async () => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(`${API_URL}/api/admin/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
   const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load dashboard");
  }

  return data;
};


// Get mechanic verification applications
export const getAdminMechanics = async (status = "pending") => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/mechanics?status=${status}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load mechanics");
  }

  return data;
};


// Approve mechanic
export const approveAdminMechanic = async (mechanicId) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/mechanics/${mechanicId}/approve`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to approve mechanic");
  }

  return data;
};


// Reject mechanic
export const rejectAdminMechanic = async (mechanicId) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/mechanics/${mechanicId}/reject`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to reject mechanic");
  }

  return data;
};
