
import { Search, Bell, UserRound } from "lucide-react";
import "./Topbar.css";
import { useNavigate } from "react-router-dom";
function DashboardTopbar() {
const user = JSON.parse(localStorage.getItem("user"));
const navigate = useNavigate();


  return (
    <header className="dashboard-topbar">
      <div className="topbar-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search anything..."
        />
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-notification"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-profile">
          <div className="topbar-avatar">
           <button className="button"

            onClick={() => navigate("/profile")}>
             <UserRound size={20} />
           </button>
          </div>

          <div className="topbar-user-info">
            <span className="topbar-user-name">
           {user ? user.fullName : "Customer"}
            </span>
            <span className="topbar-user-role">
              RoadMate User
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardTopbar;
