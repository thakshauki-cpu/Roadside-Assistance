import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  RefreshCw,
  UserRound,
  Building2,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Eye,
  ShieldCheck,
  X,
  Clock3,
  CheckCircle2,
  XCircle,
  Wrench,
} from "lucide-react";

import AdminLayout from "../../Admin/AdminLayout";
import { getInitials } from "../../Admin/adminSampleData";

import {
  getAdminMechanics,
  getAdminMechanicById,
  approveAdminMechanic,
  rejectAdminMechanic,
} from "../../../api/admin";

function AdminVerification() {
  const [tab, setTab] = useState("Pending");
  const [search, setSearch] = useState("");

  const [mechanics, setMechanics] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load applications for all three tabs
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [pendingData, approvedData, rejectedData] =
        await Promise.all([
          getAdminMechanics("pending"),
          getAdminMechanics("approved"),
          getAdminMechanics("rejected"),
        ]);

      const pendingList = pendingData.mechanics || [];
      const approvedList = approvedData.mechanics || [];
      const rejectedList = rejectedData.mechanics || [];

      setStatistics({
        pending: pendingData.count ?? pendingList.length,
        approved: approvedData.count ?? approvedList.length,
        rejected: rejectedData.count ?? rejectedList.length,
      });

      const currentList =
        tab === "Pending"
          ? pendingList
          : tab === "Approved"
          ? approvedList
          : rejectedList;

      setMechanics(currentList);
    } catch (err) {
      setError(err.message || "Unable to load mechanic applications.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Search mechanics
  const applications = useMemo(() => {
    return mechanics.filter((mechanic) => {
      const searchText = [
        mechanic.user?.fullName,
        mechanic.user?.email,
        mechanic.user?.mobile,
        mechanic.businessName,
        mechanic.phone,
        mechanic.location?.address,
        ...(mechanic.services || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(search.toLowerCase());
    });
  }, [mechanics, search]);

  // Refresh button
  const handleRefresh = () => {
    setSearch("");
    setSuccessMessage("");
    loadApplications();
  };

  // Open full mechanic details
  const handleViewDetails = async (mechanicId) => {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getAdminMechanicById(mechanicId);

      const mechanic =
        data.mechanic || data.data || data;

      setSelectedMechanic(mechanic);
    } catch (err) {
      setError(err.message || "Unable to load mechanic details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Approve or reject mechanic
  const handleVerification = async (mechanicId, action) => {
    const actionText = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this mechanic?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(action);
      setError("");
      setSuccessMessage("");

      if (action === "approve") {
        await approveAdminMechanic(mechanicId);
        setSuccessMessage("Mechanic approved successfully.");
      } else {
        await rejectAdminMechanic(mechanicId);
        setSuccessMessage("Mechanic rejected successfully.");
      }

      setSelectedMechanic(null);

      await loadApplications();
    } catch (err) {
      setError(err.message || `Unable to ${actionText} mechanic.`);
    } finally {
      setActionLoading("");
    }
  };

  // Format registration date
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (mechanic) => {
    if (
      mechanic.verificationStatus === "approved" ||
      mechanic.isVerified
    ) {
      return "Approved";
    }

    if (mechanic.verificationStatus === "rejected") {
      return "Rejected";
    }

    return "Pending";
  };

  const getStatusClass = (status) => {
    if (status === "Approved") return "green";
    if (status === "Rejected") return "red";
    return "orange";
  };

  return (
    <AdminLayout activeItem="Verification Requests">

      {/* Page heading */}
      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">
            Mechanic Verification
          </h1>

          <p className="adm-subtitle">
            Review mechanic registration details and verify workshop
            information before allowing them to provide RoadMate services.
          </p>
        </div>

        <button
          type="button"
          className="adm-btn-light av-refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="av-message success">
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="av-message error">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="adm-stats">

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>TOTAL APPLICATIONS</span>
            <span className="adm-stat-icon">
              <UserRound size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>
              {statistics.pending +
                statistics.approved +
                statistics.rejected}
            </strong>
          </div>

          <small className="adm-stat-foot">
            Registered mechanic applications
          </small>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>PENDING REVIEW</span>
            <span className="adm-stat-icon av-orange">
              <Clock3 size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{statistics.pending}</strong>
          </div>

          <small className="adm-stat-foot">
            Waiting for admin verification
          </small>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>APPROVED</span>
            <span className="adm-stat-icon av-green">
              <CheckCircle2 size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{statistics.approved}</strong>
          </div>

          <small className="adm-stat-foot">
            Verified mechanic accounts
          </small>
        </div>

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>REJECTED</span>
            <span className="adm-stat-icon red">
              <XCircle size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{statistics.rejected}</strong>
          </div>

          <small className="adm-stat-foot">
            Applications not approved
          </small>
        </div>

      </div>

      {/* Application list */}
      <section className="adm-card av-list-card">

        <div className="av-list-heading">
          <div>
            <h2>Mechanic Applications</h2>
            <p>
              Check the details submitted during mechanic registration.
            </p>
          </div>

          <span className="adm-badge orange">
            <Clock3 size={12} />
            {statistics.pending} Pending
          </span>
        </div>

        {/* Tabs and search */}
        <div className="av-toolbar">

          <div className="adm-tabs">
            {["Pending", "Approved", "Rejected"].map((item) => (
              <button
                key={item}
                type="button"
                className={tab === item ? "active" : ""}
                onClick={() => {
                  setTab(item);
                  setSearch("");
                  setSuccessMessage("");
                }}
              >
                {item}

                <span className="adm-count">
                  {item === "Pending"
                    ? statistics.pending
                    : item === "Approved"
                    ? statistics.approved
                    : statistics.rejected}
                </span>
              </button>
            ))}
          </div>

          <div className="adm-search av-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search name, workshop or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="adm-empty av-empty">
            <RefreshCw size={25} />
            <strong>Loading applications...</strong>
          </div>
        )}

        {/* Applications */}
        {!loading && (
          <div className="av-application-list">

            {applications.map((item) => {
              const name =
                item.user?.fullName || "Name not available";

              const status = getStatus(item);

              return (
                <article
                  className="av-application"
                  key={item._id}
                >
                  <div className="adm-avatar photo av-avatar">
                    {getInitials(name)}
                  </div>

                  <div className="av-application-info">

                    <div className="av-name-row">
                      <h3>{name}</h3>

                      <span
                        className={`adm-badge ${getStatusClass(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="av-specialty">
                      {item.services?.length
                        ? item.services.join(", ")
                        : "No services specified"}
                    </p>

                    <div className="av-meta">

                      <span>
                        <Building2 size={14} />
                        {item.businessName || "Workshop not available"}
                      </span>

                      <span>
                        <MapPin size={14} />
                        {item.location?.address || "Location not available"}
                      </span>

                      <span>
                        <Phone size={14} />
                        {item.phone || item.user?.mobile || "No phone"}
                      </span>

                    </div>

                    <small className="av-submitted">
                      <CalendarDays size={13} />
                      Registered: {formatDate(item.createdAt)}
                    </small>

                  </div>

                  <div className="av-application-action">
                    <button
                      type="button"
                      className="adm-btn"
                      onClick={() => handleViewDetails(item._id)}
                      disabled={detailsLoading}
                    >
                      <Eye size={15} />
                      View Details
                    </button>
                  </div>

                </article>
              );
            })}

            {/* Empty state */}
            {applications.length === 0 && (
              <div className="adm-empty av-empty">
                <ShieldCheck size={30} />

                <strong>No applications found</strong>

                <span>
                  There are no applications in this category matching your
                  search.
                </span>
              </div>
            )}

          </div>
        )}

        <div className="av-list-footer">
          Showing {applications.length} application(s)
        </div>

      </section>

      {/* Mechanic details modal */}
      {selectedMechanic && (
        <div
          className="av-modal-overlay"
          onClick={() => setSelectedMechanic(null)}
        >
          <section
            className="av-modal"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal heading */}
            <div className="av-modal-header">
              <div>
                <span className="adm-breadcrumb">
                  Application Details
                </span>

                <h2>Mechanic Registration</h2>
              </div>

              <button
                type="button"
                className="av-close"
                onClick={() => setSelectedMechanic(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile */}
            <div className="av-modal-profile">

              <div className="adm-avatar photo av-avatar">
                {getInitials(
                  selectedMechanic.user?.fullName || "Mechanic"
                )}
              </div>

              <div>
                <h3>
                  {selectedMechanic.user?.fullName || "Name not available"}
                </h3>

                <p>{selectedMechanic.businessName}</p>

                <span
                  className={`adm-badge ${getStatusClass(
                    getStatus(selectedMechanic)
                  )}`}
                >
                  {getStatus(selectedMechanic)}
                </span>
              </div>

            </div>

            {/* Personal details */}
            <div className="av-detail-section">
              <h3>
                <UserRound size={16} />
                Personal & Contact Details
              </h3>

              <div className="av-detail-grid">

                <div>
                  <small>FULL NAME</small>
                  <strong>
                    {selectedMechanic.user?.fullName || "Not available"}
                  </strong>
                </div>

                <div>
                  <small>EMAIL ADDRESS</small>
                  <strong>
                    {selectedMechanic.user?.email || "Not available"}
                  </strong>
                </div>

                <div>
                  <small>PHONE NUMBER</small>
                  <strong>
                    {selectedMechanic.phone ||
                      selectedMechanic.user?.mobile ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <small>EXPERIENCE</small>
                  <strong>
                    {selectedMechanic.experience ?? 0} years
                  </strong>
                </div>

                <div className="full">
                  <small>LOCATION</small>
                  <strong>
                    {selectedMechanic.location?.address || "Not available"}
                  </strong>
                </div>

              </div>
            </div>

            {/* Workshop details */}
            <div className="av-detail-section">
              <h3>
                <Building2 size={16} />
                Workshop Details
              </h3>

              <div className="av-detail-grid">

                <div className="full">
                  <small>WORKSHOP / GARAGE NAME</small>
                  <strong>
                    {selectedMechanic.businessName || "Not available"}
                  </strong>
                </div>

                <div className="full">
                  <small>SERVICES PROVIDED</small>

                  <strong>
                    {selectedMechanic.services?.length
                      ? selectedMechanic.services.join(", ")
                      : "No services specified"}
                  </strong>
                </div>

                <div>
                  <small>AVAILABILITY</small>
                  <strong>
                    {selectedMechanic.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </strong>
                </div>

                <div>
                  <small>VERIFICATION STATUS</small>
                  <strong>
                    {getStatus(selectedMechanic)}
                  </strong>
                </div>

              </div>
            </div>

            {/* Registration information */}
            <div className="av-detail-section">
              <h3>
                <ShieldCheck size={16} />
                Registration Information
              </h3>

              <div className="av-document-list">

                <div className="av-document-item">
                  <span>
                    <CheckCircle2 size={15} />
                  </span>
                  <p>
                    Registered on {formatDate(selectedMechanic.createdAt)}
                  </p>
                </div>

                <div className="av-document-item">
                  <span>
                    <Wrench size={15} />
                  </span>
                  <p>
                    Experience: {selectedMechanic.experience ?? 0} years
                  </p>
                </div>

                <div className="av-document-item">
                  <span>
                    <MapPin size={15} />
                  </span>
                  <p>
                    Workshop address:{" "}
                    {selectedMechanic.location?.address || "Not available"}
                  </p>
                </div>

              </div>
            </div>

            {/* Modal footer */}
            <div className="av-modal-footer">

              <p>
                <Clock3 size={14} />
                Registered: {formatDate(selectedMechanic.createdAt)}
              </p>

              <div className="av-modal-actions">

                <button
                  type="button"
                  className="adm-btn-light"
                  onClick={() => setSelectedMechanic(null)}
                  disabled={!!actionLoading}
                >
                  Close
                </button>

                {getStatus(selectedMechanic) === "Pending" && (
                  <>
                    <button
                      type="button"
                      className="av-reject-btn"
                      onClick={() =>
                        handleVerification(
                          selectedMechanic._id,
                          "reject"
                        )
                      }
                      disabled={!!actionLoading}
                    >
                      <XCircle size={15} />
                      {actionLoading === "reject"
                        ? "Rejecting..."
                        : "Reject"}
                    </button>

                    <button
                      type="button"
                      className="av-approve-btn"
                      onClick={() =>
                        handleVerification(
                          selectedMechanic._id,
                          "approve"
                        )
                      }
                      disabled={!!actionLoading}
                    >
                      <CheckCircle2 size={15} />
                      {actionLoading === "approve"
                        ? "Approving..."
                        : "Approve"}
                    </button>
                  </>
                )}

              </div>
            </div>

          </section>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminVerification;