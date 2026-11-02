
import { useEffect, useState } from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";

import { getAdminMe } from "../../api/admin";

function AdminTopbar() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const data = await getAdminMe();

        // Supports different response structures
        const adminData =
          data.admin ||
          data.user ||
          data.data?.admin ||
          data.data?.user ||
          data;

        setAdmin(adminData);
      } catch (error) {
        console.error("Admin profile error:", error);
      }
    };

    loadAdminProfile();
  }, []);

  const adminName = admin?.fullName || admin?.name || "Admin";

  const adminEmail = admin?.email || "";

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="adm-topbar">
      <label className="adm-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search operations..."
          aria-label="Search operations"
        />
      </label>

      <div className="adm-topbar-right">
        <span className="adm-online">
          <ShieldCheck size={14} /> Secure Admin Session
        </span>

        <button
          type="button"
          className="adm-bell"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="adm-bell-dot" />
        </button>

        <div className="adm-user">
          <div className="adm-user-text">
            <strong>{admin ? adminName : "Loading..."}</strong>
            <small>{adminEmail || "Administrator"}</small>
          </div>

          <span className="adm-user-avatar" aria-hidden="true">
            {admin ? initials : "A"}
          </span>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
