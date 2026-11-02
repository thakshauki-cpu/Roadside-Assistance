import { useState } from "react";
import { UserPlus, Users, Ban, TrendingUp, Search, RefreshCw, CircleCheck } from "lucide-react";
import AdminLayout from "../../Admin/AdminLayout";
import { customers, getInitials } from "../../Admin/adminSampleData";

const stats = [
  { label: "TOTAL DRIVERS", value: "1,420", icon: Users, red: false },
  { label: "ACTIVE", value: "1,388", icon: CircleCheck, red: false },
  { label: "BLOCKED", value: "32", icon: Ban, red: true },
  { label: "GROWTH PACE", value: "+38 this week", icon: TrendingUp, red: false },
];

function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [area, setArea] = useState("All");

  // Keep only the customers that match the search and both filters
  const visibleCustomers = customers.filter((item) => {
    const text = (item.name + item.phone + item.email + item.plate).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = status === "All" || item.status === status;
    const matchesArea = area === "All" || item.area.includes(area);
    return matchesSearch && matchesStatus && matchesArea;
  });

  // Clear all filters
  const handleRefresh = () => {
    setSearch("");
    setStatus("All");
    setArea("All");
  };

  return (
    <AdminLayout activeItem="Customers">
      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">
            Customers <span className="adm-chip">EP REGISTRY</span>
          </h1>
          <p className="adm-subtitle">
            Manage and monitor registered drivers and roadside assistance customers across Batticaloa &amp; Eastern
            Province corridors.
          </p>
        </div>
        <button type="button" className="adm-btn" onClick={() => alert("Add Customer form will be built later.")}>
          <UserPlus size={16} /> Add Customer
        </button>
      </div>

      <div className="adm-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="adm-card adm-stat">
              <div className="adm-stat-top">
                <span>{item.label}</span>
                <span className={"adm-stat-icon " + (item.red ? "red" : "")}>
                  <Icon size={17} />
                </span>
              </div>
              <div className="adm-stat-value">
                <strong className={item.red ? "adm-red-text" : ""}>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="adm-card adm-toolbar">
        <div className="adm-search wide">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by customer name, phone number, email, or vehicle reg"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select className="adm-select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="All">Status: All</option>
          <option value="Active">Status: Active</option>
          <option value="Blocked">Status: Blocked</option>
        </select>

        <select className="adm-select" value={area} onChange={(event) => setArea(event.target.value)}>
          <option value="All">Area: All Batticaloa</option>
          <option value="Kallady">Kallady</option>
          <option value="Puliyanthivu">Puliyanthivu</option>
          <option value="Bar Road">Bar Road</option>
          <option value="Navalady">Navalady</option>
          <option value="Chenkalady">Chenkalady</option>
        </select>

        <button type="button" className="adm-icon-btn square" onClick={handleRefresh} aria-label="Reset filters">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <section className="adm-card adm-table-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>CUSTOMER &amp; PRIMARY VEHICLE</th>
                <th>PHONE (SRI LANKA)</th>
                <th>EMAIL ADDRESS</th>
                <th>JOINED DATE</th>
                <th>ASSISTANCE VOLUME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((item) => (
                <tr key={item.id} className={item.status === "Blocked" ? "adm-row-red" : ""}>
                  <td>
                    <div className="adm-person">
                      <span className="adm-avatar big">{getInitials(item.name)}</span>
                      <div>
                        <strong>
                          {item.name} {item.status === "Blocked" && <span className="adm-badge red">RESTRICTED</span>}
                        </strong>
                        <small>
                          <span className="adm-plate">{item.plate}</span> {item.vehicle}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{item.phone}</strong>
                    <small className={item.status === "Blocked" ? "adm-red-text" : ""}>{item.phoneNote}</small>
                  </td>
                  <td>
                    <strong>{item.email}</strong>
                    <small>{item.area}</small>
                  </td>
                  <td>{item.joined}</td>
                  <td>
                    <strong className={item.status === "Blocked" ? "adm-red-text" : "adm-blue-text"}>{item.requests}</strong>
                    <small className="adm-blue-text">{item.spent}</small>
                  </td>
                  <td>
                    <span className={"adm-badge " + (item.status === "Active" ? "blue" : "red")}>● {item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleCustomers.length === 0 && <p className="adm-empty">No customers match your search.</p>}
        </div>

        <div className="adm-pagination">
          <span>
            Showing <b>1</b> to <b>{visibleCustomers.length}</b> of <b>1,420</b> customers
          </span>
          <div className="adm-pages">
            <button type="button">Previous</button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">178</button>
            <button type="button">Next</button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminCustomers;
