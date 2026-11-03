import { Search, Crosshair, Headset, Bell, Star } from "lucide-react";

// notificationCount, rating and jobs will come from the backend later
function MechanicTopbar({ notificationCount = 0, rating = "--", jobs = "--" }) {
  // The logged-in user was saved by the login page
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const name = user.fullName || "Mechanic";

  return (
    <header className="mech-topbar">
      <div className="mech-search">
        <Search size={16} />
        <input type="text" placeholder="Search jobs, ticket ID, or +94 phone..." />
      </div>

      <span className="mech-pill">
        <Crosshair size={14} /> Kallady, Batticaloa
      </span>

      <div className="mech-topbar-right">
        <span className="mech-pill blue">
          <Headset size={14} /> Helpdesk: 065 222 4500
        </span>

        <button type="button" className="mech-bell" aria-label="Notifications">
          <Bell size={19} />
          {notificationCount > 0 && <span className="mech-bell-count">{notificationCount}</span>}
        </button>

        <div className="mech-user">
          <div className="mech-user-text">
            <strong>{name}</strong>
            <small>
              <Star size={11} fill="currentColor" /> {rating} ({jobs} jobs)
            </small>
          </div>

          {/* First letter of the name inside a circle */}
          <span className="mech-avatar big">{name.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}

export default MechanicTopbar;