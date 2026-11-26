const API_URL = import.meta.env.VITE_API_URL;

const request = async (path, options = {}) => {
  if (!API_URL) {
    throw new Error(
      "The backend URL is not configured. Set VITE_API_URL in Frontend/.env."
    );
  }

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
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

export const getMechanicDashboardStats = () =>
  request("/api/mechanics/me/dashboard-stats");

export const getPendingServiceRequests = () =>
  request("/api/service-requests/mechanic/pending");

export const getAssignedServiceRequests = () =>
  request("/api/service-requests/mechanic/assigned");

export const getMechanicReviews = () => request("/api/mechanics/me/reviews");

export const getMechanics = ({
  search = "",
  service = "All Services",
  availableOnly = false,
  signal,
} = {}) => {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (service !== "All Services") params.set("service", service);
  if (availableOnly) params.set("availableOnly", "true");

  const query = params.toString();
  return request(`/api/mechanics${query ? `?${query}` : ""}`, { signal });
};

export const acceptServiceRequest = (requestId) =>
  request(`/api/service-requests/mechanic/${encodeURIComponent(requestId)}/accept`, {
    method: "PATCH",
  });

export const rejectServiceRequest = (requestId) =>
  request(`/api/service-requests/mechanic/${encodeURIComponent(requestId)}/reject`, {
    method: "PATCH",
  });

// STEP 2: Mechanic submits inspection fee
export const submitInspectionFee = (requestId, feeData) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/inspection-fee`,
    {
      method: "POST",
      body: JSON.stringify(feeData),
    }
  );

// STEP 5: Mechanic starts traveling
export const mechanicStartTravel = (requestId) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/on-the-way`,
    {
      method: "PATCH",
    }
  );

// STEP 5: Mechanic marks arrived
export const mechanicMarkArrived = (requestId) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/arrived`,
    {
      method: "PATCH",
    }
  );

// STEP 7: Mechanic starts inspection
export const mechanicStartInspection = (requestId) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/start-inspection`,
    {
      method: "PATCH",
    }
  );

// STEP 7: Mechanic completes inspection
export const mechanicCompleteInspection = (requestId) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/complete-inspection`,
    {
      method: "PATCH",
    }
  );

// STEP 8: Mechanic submits repair quotation
export const submitRepairQuotation = (requestId, quotationData) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/repair-quotation`,
    {
      method: "POST",
      body: JSON.stringify(quotationData),
    }
  );

// STEP 10: Mechanic marks repair completed
export const mechanicCompleteRepair = (requestId) =>
  request(
    `/api/service-requests/mechanic/${encodeURIComponent(requestId)}/complete-repair`,
    {
      method: "PATCH",
    }
  );
