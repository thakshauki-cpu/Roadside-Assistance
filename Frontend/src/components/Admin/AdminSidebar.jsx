import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Store, ShieldCheck, Banknote, Star, Settings, LogOut } from "lucide-react";
import logo from "../../assets/logo.png";

// Each menu item: name, icon and the page it opens
const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Mechanics", icon: Store, path: "/admin/mechanics" },
  { label: "Verification Requests", icon: ShieldCheck, path: "/admin/verification",  },
//   { label: "Payment Details", icon: Banknote, path: "/admin/payments" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
//   { label: "Settings", icon: Settings, path: "/admin/settings" },
];

// activeItem is the menu name that should look highlighted
function AdminSidebar({ activeItem }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/admin/login");
  };

  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar-top">
        <img src={logo} alt="RoadMate" className="adm-logo" />
        <span className="adm-admin-tag">ADMIN</span>
      </div>

      {/* <p className="adm-menu-title">OPERATIONS CONSOLE</p> */}

      <nav className="adm-menu">
        {menuItems.map((item) => {
          const Icon = item.icon; // component names must start with a capital letter

          return (
            <Link
              key={item.label}
              to={item.path}
              className={"adm-menu-link " + (activeItem === item.label ? "active" : "")}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.badge && <span className="adm-menu-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <button type="button" className="adm-signout" onClick={handleSignOut}>
        <LogOut size={16} /> Sign Out
      </button>
    </aside>
  );
}

export default AdminSidebar;