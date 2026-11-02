import { Bell, Search, ShieldCheck } from "lucide-react";
import { adminUser } from "./adminSampleData";

function AdminTopbar() {
  return (
    <header className="adm-topbar">
      <label className="adm-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder="Search operations..." aria-label="Search operations" />
      </label>

      <div className="adm-topbar-right">
        <span className="adm-online">
          <ShieldCheck size={14} /> Secure Admin Session
        </span>
        <button type="button" className="adm-bell" aria-label="Notifications">
          <Bell size={18} />
          <span className="adm-bell-dot" />
        </button>
        <div className="adm-user">
          <div className="adm-user-text">
            <strong>{adminUser.name}</strong>
            <small>{adminUser.role}</small>
          </div>
          <span className="adm-user-avatar" aria-hidden="true">
            {adminUser.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
