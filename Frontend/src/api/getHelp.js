const API_URL = import.meta.env.VITE_API_URL;

const request = async (path, options = {}) => {
  if (!API_URL) {
    throw new Error(
      "The backend URL is not configured. Set VITE_API_URL in Frontend/.env and restart Vite."
    );
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login again to continue your service request.");
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
      throw new Error(
        `Cannot connect to the backend at ${API_URL}. Start the backend server and confirm VITE_API_URL in Frontend/.env.`,
        { cause: error }
      );
    }
    throw error;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Unable to process the Get Help request.");
  }

  return data;
};

export const createServiceRequest = (details) =>
  request("/api/service-requests", {
    method: "POST",
    body: JSON.stringify(details),
  });

const requestPath = (requestId, stage) =>
  `/api/get-help/${encodeURIComponent(requestId)}/${stage}`;

export const getNearbyMechanics = (requestId) =>
  request(requestPath(requestId, "nearby-mechanics"));

export const getAssignment = (requestId) =>
  request(requestPath(requestId, "assignment"));

export const respondToQuotation = (requestId, response, mechanicId) =>
  request(requestPath(requestId, "quotation-response"), {
    method: "POST",
    body: JSON.stringify({ response, mechanicId }),
  });

export const getTracking = (requestId) =>
  request(requestPath(requestId, "tracking"));

export const getCompletion = (requestId) =>
  request(requestPath(requestId, "completion"));

export const submitMockPayment = (requestId, payment) =>
  request(requestPath(requestId, "payment"), {
    method: "POST",
    body: JSON.stringify(payment),
  });

export const getCustomerReview = (requestId) =>
  request(requestPath(requestId, "review"));

export const submitCustomerReview = (requestId, review) =>
  request(requestPath(requestId, "review"), {
    method: "POST",
    body: JSON.stringify(review),
  });

export const getServiceSummary = (requestId) =>
  request(requestPath(requestId, "summary"));
