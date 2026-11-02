import { Navigate } from "react-router-dom";

// Only lets the admin see the page if they logged in
function AdminProtectedRoute({ children }) {
  const loggedIn = localStorage.getItem("adminLoggedIn");

  if (loggedIn !== "true") {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default AdminProtectedRoute;