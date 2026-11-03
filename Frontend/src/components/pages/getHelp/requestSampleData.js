export function formatRs(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-US");
}

export function readRequest() {
  try {
    return JSON.parse(localStorage.getItem("serviceRequest")) || {};
  } catch {
    return {};
  }
}

export function readCreatedRequest() {
  try {
    return JSON.parse(localStorage.getItem("createdServiceRequest")) || {};
  } catch {
    return {};
  }
}

export function getCreatedRequestId() {
  const request = readCreatedRequest();
  return request._id || request.id || "";
}