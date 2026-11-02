import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Activity, Store, Users, MapPin, ShieldCheck, Info, Star, Check, X, Hourglass } from "lucide-react";
import AdminLayout from "../../Admin/AdminLayout";
import { liveRequests, verificationQueue, customerReviews, formatRs, getInitials } from "../../Admin/adminSampleData";

// The 4 cards at the top
const stats = [
  { label: "Total Platform Volume", value: "Rs. 10000", icon: Banknote, badge: "", foot: "" },
  { label: "Roadside Requests", value: "4", icon: Activity, badge: "In-Progress", foot: "● 8 Dispatched   ● 6 Arriving" },
  { label: "Registered Mechanics", value: "6", icon: Store, badge: "12 Online Now", foot: "Verification Backlog: 5 Pending" },
  { label: "Total Registered Drivers", value: "10", icon: Users, badge: "", foot: "+38 new this week • 98.4% Satisfied" },
];

// The tabs above the request table
const tabs = [
  { key: "all", label: "All Requests (14)" },
  { key: "dispatched", label: "Dispatched (8)" },
  { key: "completed", label: "Completed Today (42)" },
  { key: "cancelled", label: "Cancelled (2)" },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [queue, setQueue] = useState(verificationQueue);

  // Show only the requests of the selected tab
  const visibleRequests = liveRequests.filter((item) => activeTab === "all" || item.tab === activeTab);

  // How many applications still need action
  const pendingCount = queue.filter((item) => item.status === "pending").length;

  // Approve: change the status of one item
  const handleApprove = (id) => {
    setQueue(queue.map((item) => (item.id === id ? { ...item, status: "approved" } : item)));
  };

  // Reject: remove the item from the list
  const handleReject = (id) => {
    setQueue(queue.filter((item) => item.id !== id));
  };

  // Pick the badge colour from the status text
  const statusClass = (status) => {
    if (status === "Completed") return "adm-badge blue";
    if (status === "Pending Assignment") return "adm-badge orange";
    return "adm-badge red";
  };

  return (
    <AdminLayout activeItem="Dashboard">
      <span className="adm-chip">LIVE OPERATIONAL CONSOLE</span>
      <h1 className="adm-title">Admin Overview &amp; Dispatch</h1>
      <p className="adm-subtitle">
        Welcome back, System Admin. System operating nominally with <b className="adm-blue-text">18 Mechanics Active</b>{" "}
        across Batticaloa &amp; Coastal Highway Corridors • 99.8% Uptime.
      </p>

      {/* Stat cards */}
      <div className="adm-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="adm-card adm-stat">
              <div className="adm-stat-top">
                <span>{item.label}</span>
                <span className="adm-stat-icon">
                  <Icon size={17} />
                </span>
              </div>
              <div className="adm-stat-value">
                <strong>{item.value}</strong>
                {item.badge && <span className="adm-badge orange">{item.badge}</span>}
              </div>
              {item.foot && <small className="adm-stat-foot">{item.foot}</small>}
            </div>
          );
        })}
      </div>

      {/* Live requests table */}
      <section className="adm-card adm-section">
        <div className="adm-section-head">
          <div>
            <h2>Live Roadside Operations &amp; Requests</h2>
            <p>Real-time incident dispatching across Puliyanthivu, Kallady, Urani &amp; Navalady</p>
          </div>

          <div className="adm-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>REQUEST ID</th>
                <th>CUSTOMER</th>
                <th>ASSIGNED MECHANIC / SHOP</th>
                <th>SERVICE &amp; ISSUE</th>
                <th>LOCATION (BATTICALOA)</th>
                <th>STATUS</th>
                <th>AMOUNT (RS.)</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((item) => (
                <tr key={item.id} className={item.tab === "dispatched" ? "adm-row-warn" : ""}>
                  <td className="adm-id">{item.id}</td>
                  <td>
                    <div className="adm-person">
                      <span className="adm-avatar">{item.customer.charAt(0)}</span>
                      <div>
                        <strong>{item.customer}</strong>
                        <small>{item.plate}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.shop ? (
                      <>
                        <strong>{item.mechanic}</strong>
                        <small>{item.shop}</small>
                      </>
                    ) : item.tab === "dispatched" ? (
                      <strong className="adm-brown">
                        <Hourglass size={13} /> {item.mechanic}
                      </strong>
                    ) : (
                      <span>{item.mechanic}</span>
                    )}
                  </td>
                  <td>{item.service}</td>
                  <td>
                    <MapPin size={12} /> {item.location}
                  </td>
                  <td>
                    <span className={statusClass(item.status)}>{item.status}</span>
                  </td>
                  <td>
                    <strong>{formatRs(item.amount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom: verification queue + reviews */}
      <div className="adm-dash-bottom">
        <section className="adm-card adm-section">
          <div className="adm-section-head">
            <h2>
              <ShieldCheck size={18} /> Mechanic Verification Queue
            </h2>
            <span className="adm-badge orange">{pendingCount} Needs Action</span>
          </div>

          <p className="adm-note">
            <Info size={15} /> Sri Lankan regulatory compliance requirement: Validate Sri Lankan National Identity Card
            (NIC) and NVQ trade credentials before routing live roadside breakdowns.
          </p>

          {queue.map((item) => (
            <div key={item.id} className="adm-queue-item">
              <span className="adm-avatar big">{getInitials(item.name)}</span>

              <div className="adm-queue-info">
                <strong>{item.name}</strong> <span className="adm-badge grey">{item.tag}</span>
                <small>{item.info}</small>
                <div>
                  {item.chips.map((chip) => (
                    <span key={chip} className="adm-mini-chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {item.status === "pending" ? (
                <div className="adm-queue-actions">
                  <button type="button" className="adm-btn-light" onClick={() => navigate("/admin/verification/review")}>
                    Inspect
                  </button>
                  <button type="button" className="adm-btn" onClick={() => handleApprove(item.id)}>
                    Approve
                  </button>
                  <button type="button" className="adm-icon-btn" onClick={() => handleReject(item.id)} aria-label="Reject">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <span className="adm-badge blue">
                  <Check size={12} /> Approved Today
                </span>
              )}
            </div>
          ))}
        </section>

        <section className="adm-card adm-section">
          <div className="adm-section-head">
            <h2>
              <Star size={18} /> Customer Reviews
            </h2>
            <span className="adm-badge grey">4.85 ★</span>
          </div>

          {customerReviews.map((review) => (
            <div key={review.id} className="adm-review-box">
              <div className="adm-review-top">
                <strong>{review.mechanic}</strong>
                <span className="adm-stars">{"★".repeat(review.stars)}</span>
              </div>
              <p>"{review.text}"</p>
              <small>
                — {review.by} <span>{review.time}</span>
              </small>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;