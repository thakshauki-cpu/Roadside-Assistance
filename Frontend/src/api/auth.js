// Backend URL comes from Frontend/.env (VITE_API_URL=http://localhost:5000)
const API_URL = import.meta.env.VITE_API_URL;

// Register a new user
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData), // convert the JS object to JSON text
  });

  const data = await response.json();

  // If the backend sent an error status (400, 401, 409...), throw the message
  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
};

// Login an existing user
export const loginUser = async (loginData) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

// Get the currently logged-in user (needs the token)
export const getMe = async (token) => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to get user details");
  }

  return data;
};