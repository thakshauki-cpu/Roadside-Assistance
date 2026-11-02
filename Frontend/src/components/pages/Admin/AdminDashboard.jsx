
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  Store,
  Users,
  MapPin,
  ShieldCheck,
  Info,
  Star,
  X,
} from "lucide-react";

import AdminLayout from "../../Admin/AdminLayout";

import {
  customerReviews,
  getInitials,
} from "../../Admin/adminSampleData";

import {
  getAdminDashboard,
  getAdminMechanics,
  approveAdminMechanic,
  rejectAdminMechanic,
} from "../../../api/admin";

function AdminDashboard() {
  const navigate = useNavigate();

  // Dashboard states
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Request filter
  const [activeTab, setActiveTab] = useState("all");

  // Mechanic verification states
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Fetch pending mechanics
  const loadMechanicQueue = async () => {
    try {
      setQueueLoading(true);
      setQueueError("");

      const data = await getAdminMechanics("pending");

      setQueue(data.mechanics || []);
    } catch (err) {
      setQueueError(err.message);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    loadMechanicQueue();
  }, []);

  // Dashboard data
  const overview = dashboard?.overview;
  const requests = dashboard?.recentRequests || [];

  // Pending mechanic count
  const pendingCount = queue.length;

  // Dashboard statistics
  const stats = overview
    ? [
        {
          label: "Total Customers",
          value: overview.totalCustomers,
          icon: Users,
          foot: "Registered customer accounts",
        },
        {
          label: "Roadside Requests",
          value: overview.totalRequests,
          icon: Activity,
          badge: `${overview.activeRequests} Active`,
          foot: `${overview.completedRequests} Completed`,
        },
        {
          label: "Registered Mechanics",
          value: overview.totalMechanics,
          icon: Store,
          foot: "Total registered mechanics",
        },
        {
          label: "Mechanic Verification",
          value: overview.pendingMechanics,
          icon: ShieldCheck,
          badge: "Pending",
          foot: `${overview.verifiedMechanics} Verified`,
        },
      ]
    : [];

  // Filter requests
  const visibleRequests = requests.filter((item) => {
    if (activeTab === "all") return true;

    if (activeTab === "dispatched") {
      return [
        "assigned",
        "accepted",
        "on_the_way",
        "in_progress",
      ].includes(item.status);
    }

    if (activeTab === "completed") {
      return item.status === "completed";
    }

    if (activeTab === "cancelled") {
      return item.status === "cancelled";
    }

    return true;
  });

  // Format request status
  const formatStatus = (status) => {
    return (
      status
        ?.split("_")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ") || "Unknown"
    );
  };

  const statusClass = (status) => {
    if (status === "completed") return "adm-badge blue";

    if (["pending", "searching"].includes(status)) {
      return "adm-badge orange";
    }

    if (status === "cancelled") return "adm-badge red";

    return "adm-badge blue";
  };

  // Approve mechanic
  const handleApprove = async (id) => {
    try {
      setActionLoading(id);

      await approveAdminMechanic(id);

      setQueue((previous) =>
        previous.filter((item) => item._id !== id)
      );

      alert("Mechanic approved successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading("");
    }
  };

  // Reject mechanic
  const handleReject = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this mechanic?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(id);

      await rejectAdminMechanic(id);

      setQueue((previous) =>
        previous.filter((item) => item._id !== id)
      );

      alert("Mechanic rejected successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <AdminLayout activeItem="Dashboard">

      {/* Dashboard Statistics */}
      {loading ? (
        <p>Loading dashboard data...</p>
      ) : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <>
          <div className="adm-stats">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="adm-card adm-stat"
                >
                  <div className="adm-stat-top">
                    <span>{item.label}</span>

                    <span className="adm-stat-icon">
                      <Icon size={17} />
                    </span>
                  </div>

                  <div className="adm-stat-value">
                    <strong>{item.value}</strong>

                    {item.badge && (
                      <span className="adm-badge orange">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <small className="adm-stat-foot">
                    {item.foot}
                  </small>
                </div>
              );
            })}
          </div>

          {/* Recent Requests */}
          <section className="adm-card adm-section">
            <div className="adm-section-head">
              <div>
                <h2>
                  Live Roadside Operations &amp; Requests
                </h2>
                <p>Latest roadside assistance requests</p>
              </div>

              <div className="adm-tabs">
                {[
                  { key: "all", label: "All Requests" },
                  { key: "dispatched", label: "Dispatched" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={
                      activeTab === tab.key ? "active" : ""
                    }
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
                    <th>ASSIGNED MECHANIC</th>
                    <th>SERVICE &amp; ISSUE</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>AMOUNT (RS.)</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRequests.length > 0 ? (
                    visibleRequests.map((item) => (
                      <tr key={item._id}>
                        <td className="adm-id">
                          #{item._id.slice(-6).toUpperCase()}
                        </td>

                        <td>
                          <div className="adm-person">
                            <span className="adm-avatar">
                              {item.customer?.fullName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </span>

                            <div>
                              <strong>
                                {item.customer?.fullName || "Unknown"}
                              </strong>

                              <small>
                                {item.vehicle?.registrationNumber ||
                                  "No vehicle"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.mechanic ? (
                            <strong>
                              {item.mechanic.fullName}
                            </strong>
                          ) : (
                            <span>Not assigned</span>
                          )}
                        </td>

                        <td>{item.problem}</td>

                        <td>
                          <MapPin size={12} />
                          {" "}
                          {item.location?.address ||
                            "Location unavailable"}
                        </td>

                        <td>
                          <span className={statusClass(item.status)}>
                            {formatStatus(item.status)}
                          </span>
                        </td>

                        <td>
                          <strong>—</strong>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center" }}
                      >
                        No requests found for this status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Mechanic Verification Queue + Customer Reviews */}
      <div className="adm-dash-bottom">

        {/* Real Mechanic Verification Queue */}
        <section className="adm-card adm-section">
          <div className="adm-section-head">
            <h2>
              <ShieldCheck size={18} />
              Mechanic Verification Queue
            </h2>

            <span className="adm-badge orange">
              {pendingCount} Needs Action
            </span>
          </div>

          <p className="adm-note">
            <Info size={15} />
            Validate mechanic details before approving their accounts.
          </p>

          {queueLoading ? (
            <p>Loading mechanic applications...</p>
          ) : queueError ? (
            <p className="adm-error">{queueError}</p>
          ) : queue.length === 0 ? (
            <p>No pending mechanic applications.</p>
          ) : (
            queue.map((item) => (
              <div
                key={item._id}
                className="adm-queue-item"
              >
                <span className="adm-avatar big">
                  {getInitials(
                    item.user?.fullName ||
                    item.businessName ||
                    "Mechanic"
                  )}
                </span>

                <div className="adm-queue-info">
                  <strong>
                    {item.user?.fullName || "Unknown Mechanic"}
                  </strong>

                  <span className="adm-badge grey">
                    {item.businessName || "Business name unavailable"}
                  </span>

                  <small>
                    {item.location?.address || "Location unavailable"}
                  </small>

                  <small>
                    Phone: {item.phone || item.user?.mobile || "Not provided"}
                    {" • "}
                    Experience: {item.experience ?? 0} years
                  </small>

                  <div>
                    {(item.services || []).map((service) => (
                      <span
                        key={service}
                        className="adm-mini-chip"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="adm-queue-actions">
                  <button
                    type="button"
                    className="adm-btn-light"
                    onClick={() =>
                      navigate(
                        `/admin/verification/review?id=${item._id}`
                      )
                    }
                  >
                    Inspect
                  </button>

                  <button
                    type="button"
                    className="adm-btn"
                    disabled={actionLoading === item._id}
                    onClick={() => handleApprove(item._id)}
                  >
                    {actionLoading === item._id
                      ? "Please wait..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    className="adm-icon-btn"
                    disabled={actionLoading === item._id}
                    onClick={() => handleReject(item._id)}
                    aria-label="Reject mechanic"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Customer Reviews - Sample Data for now */}
        <section className="adm-card adm-section">
          <div className="adm-section-head">
            <h2>
              <Star size={18} />
              Customer Reviews
            </h2>

            <span className="adm-badge grey">
              Sample Data
            </span>
          </div>

          {customerReviews.map((review) => (
            <div
              key={review.id}
              className="adm-review-box"
            >
              <div className="adm-review-top">
                <strong>{review.mechanic}</strong>

                <span className="adm-stars">
                  {"★".repeat(review.stars)}
                </span>
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
