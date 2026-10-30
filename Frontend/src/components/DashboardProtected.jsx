import { Navigate } from "react-router-dom";

// Only lets the user see the page if a token is saved (user is logged in)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // No token means not logged in, so send the user to the login page
  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;