
import {
  CarFront,
  LayoutDashboard,
  Wrench,
  Clock,
  Bell,
  UserRound,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Find Mechanic", icon: Wrench },
  { label: "My Requests", icon: Clock },
  { label: "Notifications", icon: Bell, badge: "3" },
  { label: "Profile", icon: UserRound },
  { label: "Settings", icon: Settings },
  { label: "Help & Support", icon: CircleHelp },
];

function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <a className="dashboard-brand" href="/dashboard">
        <CarFront size={21} strokeWidth={2.7} />
        <span>RoadMate</span>
      </a>

      <nav className="dashboard-navigation">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <a
              href="#"
              key={item.label}
              className={`dashboard-nav-link ${
                index === 0 ? "active" : ""
              }`}
              onClick={(event) => event.preventDefault()}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="dashboard-nav-badge">{item.badge}</span>
              )}
            </a>
          );
        })}
      </nav>

      <button
        className="dashboard-logout"
        type="button"
        onClick={() => alert("Logout will be connected later.")}
      >
        <LogOut size={14} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default DashboardSidebar;
