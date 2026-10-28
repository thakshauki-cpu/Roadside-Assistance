
import {
  Activity,
  LayoutDashboard,
  Wrench,
  Clock,
  Bell,
  UserRound,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,          //icon as item
    path: "/dashboard",
  },
  {
    label: "Find Mechanic",
    icon: Wrench,
    path: "/find-mechanic",
  },
  {
    label: "My Requests",
    icon: Clock,
    path: "/my-requests",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    
  },
  {
    label: "Profile",
    icon: UserRound,
    path: "/profile",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
  {
    label: "Help & Support",
    icon: CircleHelp,
    path: "/help",
  },
];

function DashboardSidebar({ activeItem = "Dashboard" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
          <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          className="logo"
          />
      </div>
      

      {/* Navigation */}
      <nav className="sidebar-navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.label;

          return (
            <button
              key={item.label}
              type="button"
              className={`sidebar-nav-link ${
                isActive ? "active" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} strokeWidth={1.9} />

              <span className="sidebar-nav-label">
                {item.label}
              </span>

              {item.badge && (
                <span className="sidebar-nav-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
