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