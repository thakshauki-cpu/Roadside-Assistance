import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMechanicProfile } from "../../api/mechanic";

function MechanicProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;

    getMechanicProfile()
      .then(({ profile }) => {
        if (
          active &&
          profile?.verificationStatus === "approved" &&
          profile?.isVerified === true
        ) {
          setAuthorized(true);
        }
      })
      .catch(() => {
        if (active) {
          setAuthorized(false);
        }
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!token || (!checking && !authorized)) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return <p role="status">Verifying mechanic access...</p>;
  }

  return children;
}

export default MechanicProtectedRoute;