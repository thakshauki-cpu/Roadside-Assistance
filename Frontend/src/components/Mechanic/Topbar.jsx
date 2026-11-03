import {
  Search,
  Crosshair,
  Headset,
  Bell,
  Star,
} from "lucide-react";

function MechanicTopbar({
  notificationCount = 3,
  rating = "4.9",
  jobs = 142,
}) {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const name = user.fullName || "Mechanic";

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

      {/* Location */}
      <div className="mech-pill">
        <Crosshair size={14} />
        Kallady, Batticaloa
      </div>

      {/* Right side */}
      <div className="mech-topbar-right">

        <div className="mech-pill mech-helpdesk">
          <Headset size={14} />
          Helpdesk: 065 222 4500
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="mech-bell"
          aria-label="Notifications"
        >
          <Bell size={19} />

          {notificationCount > 0 && (
            <span className="mech-bell-count">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Mechanic profile */}
        <div className="mech-user">

          <div className="mech-user-text">
            <strong>{name}</strong>

            <small>
              <Star size={11} fill="currentColor" />
              {rating} ({jobs} jobs)
            </small>
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