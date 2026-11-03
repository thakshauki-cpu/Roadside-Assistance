import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Wallet,
  CircleUserRound,
  Bell,
  Settings,
  LogOut,
  MapPin,
} from "lucide-react";

import logo from "../../assets/logo.png";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/mechanic/dashboard",
  },
  {
    label: "Requests",
    icon: Wrench,
    path: "/mechanic/requests",
    showCount: true,
  },
  {
    label: "Earnings",
    icon: Wallet,
    path: "/mechanic/earnings",
  },
  {
    label: "Profile",
    icon: CircleUserRound,
    path: "/mechanic/profile",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/mechanic/notifications",
    showDot: true,
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/mechanic/settings",
  },
];

function MechanicSidebar({
  activeItem = "Dashboard",
  pendingCount = 3,
}) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="mech-sidebar">

      {/* Logo */}
      <div className="mech-brand">
        <img src={logo} alt="RoadMate" />
      </div>

      {/* Location */}
      <div className="mech-sector">
        <MapPin size={13} />
        <span>Batticaloa Sector (Eastern Province)</span>
      </div>

      {/* Navigation */}
      <nav className="mech-menu">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={
                "mech-menu-link " +
                (activeItem === item.label ? "active" : "")
              }
            >
              <Icon size={17} />

              <span>{item.label}</span>

              {item.showCount && pendingCount > 0 && (
                <span className="mech-menu-count">
                  {pendingCount}
                </span>
              )}

              {item.showDot && (
                <span className="mech-menu-dot" />
              )}
            </Link>
          );
        })}

      </nav>

      {/* Bottom section */}
      <div className="mech-sidebar-bottom">

        <div className="mech-duty-box">

          <div className="mech-duty-row">
            <small>DUTY STATUS</small>

            <button
              type="button"
              className={isOnline ? "online" : "offline"}
              onClick={() => setIsOnline(!isOnline)}
            >
              ● {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
          </div>

          <span>
            {isOnline
              ? "Available for Emergency Jobs"
              : "Not receiving new jobs"}
          </span>

        </div>

        <button
          type="button"
          className="mech-logout"
          onClick={handleLogout}
        >
          <LogOut size={15} />
          Log Out
        </button>

      </div>

    </aside>
  );
}

export default MechanicSidebar;