
import { useState } from "react";
import { Search, Bell, UserRound } from "lucide-react";

function DashboardTopbar() {
  const [search, setSearch] = useState("");

  return (
    <header className="dashboard-topbar">
      <label className="dashboard-search">
        <Search size={15} />
        <input
          type="search"
          placeholder="Search requests, mechanics, services..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search dashboard"
        />
      </label>

      <div className="dashboard-topbar-actions">
        <button
          type="button"
          className="dashboard-notification-button"
          aria-label="Notifications"
          onClick={() => alert("Notifications panel will be added later.")}
        >
          <Bell size={17} />
          <span className="dashboard-notification-dot" />
        </button>

        <button
          type="button"
          className="dashboard-user-button"
          onClick={() => alert("Customer profile will be added later.")}
        >
          <span className="dashboard-user-avatar">
            <UserRound size={15} />
            <i />
          </span>
          <span>John Doe</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardTopbar;
