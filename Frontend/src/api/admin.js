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

export const getAdminReviews = async () => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(`${API_URL}/api/admin/reviews`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load customer reviews.");
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

// Get a mechanic's full verification details
export const getAdminMechanicById = async (mechanicId) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/mechanics/${mechanicId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load mechanic details.");
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



 // CUSTOMER MANAGEMENT API
 

// Get Admin Customers
export const getAdminCustomers = async ({
  search = "",
  status = "All",
  page = 1,
  limit = 10,
} = {}) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const params = new URLSearchParams({
    search,
    status,
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/api/admin/customers?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load customers.");
  }

  return data;
};


// Get Single Customer Details
export const getAdminCustomerById = async (customerId) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/customers/${customerId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load customer details.");
  }

  return data;
};


// Block / Unblock Customer
export const updateAdminCustomerStatus = async (
  customerId,
  isActive
) => {
  const token =
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin token not found. Please login again.");
  }

  const response = await fetch(
    `${API_URL}/api/admin/customers/${customerId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to update customer status.");
  }

  return data;
};
