import { useState } from "react";
import { Plus, Users, Radio, Store, TriangleAlert, Search, RefreshCw, MapPin, Phone, Star, BadgeCheck } from "lucide-react";
import AdminLayout from "../../Admin/AdminLayout";
import { mechanics, getInitials } from "../../Admin/adminSampleData";

function AdminMechanics() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [specialty, setSpecialty] = useState("All");

  const visibleMechanics = mechanics.filter((item) => {
    const text = (item.name + item.garage + item.phone + item.specialty).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesTab = tab === "All" || item.status === tab;
    const matchesArea = area === "All" || item.area.includes(area);
    const matchesSpecialty = specialty === "All" || item.specialty.includes(specialty);
    return matchesSearch && matchesTab && matchesArea && matchesSpecialty;
  });

  const handleRefresh = () => {
    setSearch("");
    setTab("All");
    setArea("All");
    setSpecialty("All");
  };

  const tabList = [
    { key: "All", label: "All", count: 6 },
    { key: "Approved", label: "Approved", count: 4 },
    { key: "Blocked", label: "Blocked", count: 0},
  ];

  return (
    <AdminLayout activeItem="Mechanics">
      

      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">
            Mechanics 
          </h1>
          <p className="adm-subtitle">
            Manage, monitor, and regulate verified roadside technicians and garage partners across Batticaloa &amp;
            Eastern Province corridors.
          </p>
        </div>
        
      </div>

      {/* Stat cards */}
      <div className="adm-stats">
        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>TOTAL MECHANICS</span>
            <span className="adm-stat-icon"><Users size={17} /></span>
          </div>
          <div className="adm-stat-value"><strong>15</strong><small>Eastern Province</small></div>
          <small className="adm-stat-foot">All background checked &amp; geo-tagged</small>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>ONLINE NOW</span>
            <span className="adm-stat-icon"><Radio size={17} /></span>
          </div>
          <div className="adm-stat-value"><strong>4</strong><span className="adm-badge blue">● Ready for Dispatch</span></div>
          <small className="adm-stat-foot">Average Batticaloa ETA: 14 mins</small>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>APPROVED GARAGES</span>
            <span className="adm-stat-icon"><Store size={17} /></span>
          </div>
          <div className="adm-stat-value"><strong>8</strong><small>85%Compliance</small></div>
          <div className="adm-progress"><span style={{ width: "85%" }} /></div>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>SUSPENDED / FLAGGED</span>
            <span className="adm-stat-icon red"><TriangleAlert size={17} /></span>
          </div>
          <div className="adm-stat-value"><strong className="adm-red-text">6</strong><span className="adm-badge red">Requires Review</span></div>
          <small className="adm-stat-foot">Overcharging or documentation flags</small>
        </div>
      </div>

      {/* Tabs and filters */}
      <div className="adm-card adm-toolbar column">
        <div className="adm-toolbar-top">
          <div className="adm-tabs">
            {tabList.map((item) => (
              <button key={item.key} type="button" className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
                {item.label} <span className={"adm-count " + (item.key === "Blocked" ? "red" : "")}>{item.count}</span>
              </button>
            ))}
          </div>
          <div className="adm-sync">
            Sync rate: Live (30s)
            <button type="button" className="adm-icon-btn square" onClick={handleRefresh} aria-label="Reset filters">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="adm-toolbar-row">
          <div className="adm-search wide">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by mechanic name, garage, phone, or specialty"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select className="adm-select" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="All">Area: All Batticaloa</option>
            <option value="Kallady">Kallady</option>
            <option value="Puliyanthivu">Puliyanthivu</option>
            <option value="Navalady">Navalady</option>
            <option value="Urani">Urani</option>
          </select>

          <select className="adm-select" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            <option value="All">Specialty: All Capabilities</option>
            <option value="Auto">Auto</option>
            <option value="Electric">Electric</option>
            <option value="Tyre">Tyre</option>
            <option value="Diesel">Diesel</option>
            <option value="Tow">Tow</option>
            <option value="Two-Wheeler">Two-Wheeler</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <section className="adm-card adm-table-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>MECHANIC</th>
                <th>WORKSHOP / GARAGE</th>
                <th>OPERATIONAL AREA</th>
                <th>RATING</th>
                <th>COMPLETED VOLUME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {visibleMechanics.map((item) => (
                <tr key={item.id} className={item.status === "Blocked" ? "adm-row-red" : ""}>
                  <td>
                    <div className="adm-person">
                      <span className="adm-avatar big">{getInitials(item.name)}</span>
                      <div>
                        <strong>
                          {item.name} {item.status === "Blocked" && <span className="adm-badge red">SUSPENDED</span>}
                        </strong>
                        <small>
                          {item.status === "Blocked" ? (
                            <span className="adm-red-text">NIC: 841290331V</span>
                          ) : (
                            <span className="adm-badge blue"><BadgeCheck size={11} /> NIC Verified</span>
                          )}{" "}
                          • {item.specialty}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{item.garage}</strong>
                    <small><Phone size={11} /> {item.phone}</small>
                  </td>
                  <td>
                    <MapPin size={12} /> {item.area}
                  </td>
                  <td>
                    <strong className={item.status === "Blocked" ? "adm-red-text" : ""}>
                      <Star size={13} fill="currentColor" /> {item.rating}
                    </strong>{" "}
                    <small>({item.reviews})</small>
                  </td>
                  <td>
                    <strong>{item.jobs}</strong>
                    <small>{item.earned}</small>
                  </td>
                  <td>
                    <span className={"adm-badge " + (item.status === "Approved" ? "blue" : "red")}>● {item.status}</span>
                    {item.note && <small>{item.note}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleMechanics.length === 0 && <p className="adm-empty">No mechanics match your search.</p>}
        </div>

        {/* <div className="adm-pagination">
          <span>
            Showing <b>1</b> to <b>{visibleMechanics.length}</b> of <b>68</b> mechanics
          </span>
          <div className="adm-pages">
            <button type="button">Previous</button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">7</button>
            <button type="button">Next</button>
          </div>
        </div> */}
      </section>
    </AdminLayout>
  );
}

export default AdminMechanics;