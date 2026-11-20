import { useNavigate } from "react-router-dom";
import {
  Search,
  Crosshair,
  Headset,
  Bell,
  Star,
} from "lucide-react";

function MechanicTopbar({
  mechanicName = "Mechanic",
  location = "Kallady, Batticaloa",
  notificationCount = 3,
  rating = "4.9",
  jobs = 142,
  showStats = true,
  showNotifications = true,
}) {
  const navigate = useNavigate();
  const name = mechanicName || "Mechanic";

  return (
    <header className="mech-topbar">

      {/* Search */}
      <div className="mech-search">
        <Search size={16} />

        <input
          type="search"
          placeholder="Search jobs, ticket ID, or +94 phone..."
        />
      </div>

      {location && (
        <div className="mech-pill">
          <Crosshair size={14} />
          {location}
        </div>
      )}

      {/* Right side */}
      <div className="mech-topbar-right">

        <div className="mech-pill mech-helpdesk">
          <Headset size={14} />
          Helpdesk: 065 222 4500
        </div>

        {showNotifications && (
          <button
            type="button"
            className="topbar-notification"
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
          >
            <Bell size={18} color="#1e293b" />
          </button>
        )}

        {/* Mechanic profile */}
        <div className="mech-user">

          <div className="mech-user-text">
            <strong>{name}</strong>

            {showStats && (
              <small>
                <Star size={11} fill="currentColor" />
                {rating} ({jobs} jobs)
              </small>
            )}
          </div>

          <div className="mech-avatar">
            {name.charAt(0).toUpperCase()}
          </div>

        </div>

      </div>

    </header>
  );
}

export default MechanicTopbar;