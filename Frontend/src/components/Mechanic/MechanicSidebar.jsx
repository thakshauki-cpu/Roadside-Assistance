import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wrench, Wallet, CircleUserRound, Bell, Settings, LogOut, MapPin } from "lucide-react";
import logo from "../../assets/logo.png";

// Each menu item: name, icon and the page it opens
const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/mechanic/dashboard" },
  { label: "Requests", icon: Wrench, path: "/mechanic/requests", showCount: true },
  { label: "Earnings", icon: Wallet, path: "/mechanic/earnings" },
  { label: "Profile", icon: CircleUserRound, path: "/mechanic/profile" },
  { label: "Notifications", icon: Bell, path: "/mechanic/notifications", showDot: true },
  { label: "Settings", icon: Settings, path: "/mechanic/settings" },
];

// activeItem = the menu name that should look highlighted
// pendingCount = number shown on "Requests" (comes from the backend later)
// vehiclePlate and vehicleName = the mechanic's service van (from the backend later)
function MechanicSidebar({ activeItem, pendingCount = 0, vehiclePlate = "--", vehicleName = "--" }) {
  const navigate = useNavigate();

  // true = the mechanic accepts jobs. Later this will be saved in the backend.
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="mech-sidebar">
      <img src={logo} alt="RoadMate" className="mech-logo" />

      <span className="mech-sector">
        <MapPin size={12} /> Batticaloa Sector (Eastern Province)
      </span>

      <nav className="mech-menu">
        {menuItems.map((item) => {
          const Icon = item.icon; // component names must start with a capital letter

          return (
            <Link
              key={item.label}
              to={item.path}
              className={"mech-menu-link " + (activeItem === item.label ? "active" : "")}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.showCount && pendingCount > 0 && <span className="mech-menu-count">{pendingCount}</span>}
              {item.showDot && <span className="mech-menu-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: duty status, vehicle and logout */}
      <div className="mech-sidebar-bottom">
        <div className="mech-side-box">
          <div className="mech-duty-row">
            <small>DUTY STATUS</small>
            <button
              type="button"
              className={"mech-duty-button " + (isOnline ? "online" : "")}
              onClick={() => setIsOnline(!isOnline)}
            >
              ● {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
          </div>
          <span>{isOnline ? "Available for Emergency Jobs" : "Not receiving new jobs"}</span>
        </div>

        <div className="mech-side-box">
          <small>Service Vehicle</small>
          <div className="mech-vehicle-row">
            <span className="mech-plate">{vehiclePlate}</span>
            <span>{vehicleName}</span>
          </div>
        </div>

        <button type="button" className="mech-logout" onClick={handleLogout}>
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </aside>
  );
}

export default MechanicSidebar;