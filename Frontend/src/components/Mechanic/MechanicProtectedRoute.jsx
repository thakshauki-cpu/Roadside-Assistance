import { Navigate } from "react-router-dom";

function MechanicProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "mechanic") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default MechanicProtectedRoute;