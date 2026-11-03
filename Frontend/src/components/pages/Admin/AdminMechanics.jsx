
import { useState, useEffect, useCallback } from "react";

import {
  Users,
  Radio,
  Store,
  TriangleAlert,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  BadgeCheck,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";

import AdminLayout from "../../Admin/AdminLayout";

import {
  getAdminMechanics,
  approveAdminMechanic,
  rejectAdminMechanic,
} from "../../../api/admin";


function getMechanicStatus(mechanic) {
  if (mechanic.verificationStatus) {
    return mechanic.verificationStatus;
  }

  return mechanic.isVerified ? "approved" : "pending";
}


function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}


function AdminMechanics() {
  const [mechanics, setMechanics] = useState([]);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [specialty, setSpecialty] = useState("All");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");


  // Fetch all mechanics from backend
  const loadMechanics = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const data = await getAdminMechanics("all");

      setMechanics(data.mechanics || []);
    } catch (error) {
      console.error("Load mechanics error:", error);
      setError(error.message || "Unable to load mechanics.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadMechanics();
  }, [loadMechanics]);


  // Approve mechanic
  const handleApprove = async (mechanicId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this mechanic?"
    );

    if (!confirmed) return;

    try {
      setActionId(mechanicId);
      setError("");

      await approveAdminMechanic(mechanicId);

      await loadMechanics(false);
    } catch (error) {
      console.error("Approve mechanic error:", error);
      setError(error.message || "Unable to approve mechanic.");
    } finally {
      setActionId(null);
    }
  };


  // Reject mechanic
  const handleReject = async (mechanicId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this mechanic?"
    );

    if (!confirmed) return;

    try {
      setActionId(mechanicId);
      setError("");

      await rejectAdminMechanic(mechanicId);

      await loadMechanics(false);
    } catch (error) {
      console.error("Reject mechanic error:", error);
      setError(error.message || "Unable to reject mechanic.");
    } finally {
      setActionId(null);
    }
  };


  // Reset filters and reload
  const handleRefresh = () => {
    setSearch("");
    setTab("all");
    setArea("All");
    setSpecialty("All");

    loadMechanics();
  };


  // Get status counts
  const pendingCount = mechanics.filter(
    (item) => getMechanicStatus(item) === "pending"
  ).length;

  const approvedCount = mechanics.filter(
    (item) => getMechanicStatus(item) === "approved"
  ).length;

  const rejectedCount = mechanics.filter(
    (item) => getMechanicStatus(item) === "rejected"
  ).length;

  const availableCount = mechanics.filter(
    (item) => item.isAvailable === true
  ).length;


  // Get available areas from backend data
  const areas = [
    ...new Set(
      mechanics
        .map((item) => item.location?.address)
        .filter(Boolean)
    ),
  ];


  // Get available specialties from backend data
  const specialties = [
    ...new Set(
      mechanics.flatMap((item) => item.services || [])
    ),
  ];


  // Filter mechanics
  const visibleMechanics = mechanics.filter((item) => {
    const mechanicName = item.user?.fullName || "";
    const garage = item.businessName || "";
    const phone = item.phone || item.user?.mobile || "";
    const email = item.user?.email || "";
    const services = (item.services || []).join(" ");
    const address = item.location?.address || "";

    const searchText = (
      mechanicName +
      garage +
      phone +
      email +
      services +
      address
    ).toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    const status = getMechanicStatus(item);

    const matchesTab = tab === "all" || status === tab;

    const matchesArea =
      area === "All" ||
      address.toLowerCase().includes(area.toLowerCase());

    const matchesSpecialty =
      specialty === "All" ||
      (item.services || []).includes(specialty);

    return (
      matchesSearch &&
      matchesTab &&
      matchesArea &&
      matchesSpecialty
    );
  });


  const tabList = [
    { key: "all", label: "All", count: mechanics.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
  ];


  return (
    <AdminLayout activeItem="Mechanics">

      {/* Page heading */}
      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">Mechanics</h1>

          <p className="adm-subtitle">
            Manage, monitor, and verify roadside technicians
            and garage partners.
          </p>
        </div>
      </div>


      {/* Error message */}
      {error && (
        <div className="adm-error">
          {error}
        </div>
      )}


      {/* Statistics */}
      <div className="adm-stats">

        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>TOTAL MECHANICS</span>

            <span className="adm-stat-icon">
              <Users size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{mechanics.length}</strong>
            <small>Registered mechanics</small>
          </div>

          <small className="adm-stat-foot">
            All registered mechanic profiles
          </small>
        </div>


        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>AVAILABLE NOW</span>

            <span className="adm-stat-icon">
              <Radio size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{availableCount}</strong>

            <span className="adm-badge blue">
              Ready for Dispatch
            </span>
          </div>

          <small className="adm-stat-foot">
            Mechanics currently marked available
          </small>
        </div>


        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>APPROVED MECHANICS</span>

            <span className="adm-stat-icon">
              <Store size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong>{approvedCount}</strong>
            <small>Verified profiles</small>
          </div>

          <small className="adm-stat-foot">
            Successfully approved by admin
          </small>
        </div>


        <div className="adm-card adm-stat">
          <div className="adm-stat-top">
            <span>PENDING APPLICATIONS</span>

            <span className="adm-stat-icon red">
              <TriangleAlert size={17} />
            </span>
          </div>

          <div className="adm-stat-value">
            <strong className="adm-red-text">
              {pendingCount}
            </strong>

            <span className="adm-badge red">
              Requires Review
            </span>
          </div>

          <small className="adm-stat-foot">
            Waiting for admin verification
          </small>
        </div>

      </div>


      {/* Tabs and filters */}
      <div className="adm-card adm-toolbar column">

        <div className="adm-toolbar-top">

          <div className="adm-tabs">
            {tabList.map((item) => (
              <button
                key={item.key}
                type="button"
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key)}
              >
                {item.label}

                <span
                  className={
                    "adm-count " +
                    (item.key === "rejected" ? "red" : "")
                  }
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>


          <div className="adm-sync">
            Live Data

            <button
              type="button"
              className="adm-icon-btn square"
              onClick={handleRefresh}
              aria-label="Refresh mechanics"
              disabled={loading}
            >
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


          <select
            className="adm-select"
            value={area}
            onChange={(event) => setArea(event.target.value)}
          >
            <option value="All">Area: All</option>

            {areas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            className="adm-select"
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
          >
            <option value="All">Specialty: All</option>

            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

        </div>

      </div>


      {/* Mechanics table */}
      <section className="adm-card adm-table-card">

        <div className="adm-table-wrap">

          <table className="adm-table">

            <thead>
              <tr>
                <th>MECHANIC</th>
                <th>WORKSHOP / GARAGE</th>
                <th>OPERATIONAL AREA</th>
                <th>SPECIALTIES</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td colSpan="6">
                    <div className="adm-empty">
                      <LoaderCircle size={20} />
                      <p>Loading mechanics...</p>
                    </div>
                  </td>
                </tr>

              ) : visibleMechanics.map((item) => {

                const status = getMechanicStatus(item);

                const mechanicName =
                  item.user?.fullName || "Unknown Mechanic";

                const phone =
                  item.phone || item.user?.mobile || "Not provided";

                const address =
                  item.location?.address || "Location not provided";

                const services =
                  item.services?.length
                    ? item.services.join(", ")
                    : "No specialties added";


                return (
                  <tr
                    key={item._id}
                    className={
                      status === "rejected" ? "adm-row-red" : ""
                    }
                  >

                    {/* Mechanic details */}
                    <td>
                      <div className="adm-person">

                        <span className="adm-avatar big">
                          {getInitials(mechanicName)}
                        </span>

                        <div>
                          <strong>{mechanicName}</strong>

                          <small>
                            {item.user?.email || "No email provided"}
                          </small>
                        </div>

                      </div>
                    </td>


                    {/* Workshop details */}
                    <td>
                      <strong>
                        {item.businessName || "No business name"}
                      </strong>

                      <small>
                        <Phone size={11} />
                        {" "}{phone}
                      </small>
                    </td>


                    {/* Location */}
                    <td>
                      <MapPin size={12} />
                      {" "}{address}
                    </td>


                    {/* Specialties */}
                    <td>
                      <small>{services}</small>
                    </td>


                    {/* Verification status */}
                    <td>

                      <span
                        className={
                          "adm-badge " +
                          (status === "approved"
                            ? "blue"
                            : "red")
                        }
                      >
                        {status === "approved" && (
                          <BadgeCheck size={12} />
                        )}

                        ● {status.toUpperCase()}
                      </span>

                      <small>
                        {item.isAvailable
                          ? "Available"
                          : "Not available"}
                      </small>

                    </td>


                    {/* Admin actions */}
                    <td>

                      {status === "pending" ? (

                        <div className="adm-mechanic-actions">

                          <button
                            type="button"
                            className="adm-icon-btn square"
                            title="Approve mechanic"
                            aria-label="Approve mechanic"
                            disabled={actionId === item._id}
                            onClick={() => handleApprove(item._id)}
                          >
                            {actionId === item._id ? (
                              <LoaderCircle size={15} />
                            ) : (
                              <Check size={15} />
                            )}
                          </button>


                          <button
                            type="button"
                            className="adm-icon-btn square"
                            title="Reject mechanic"
                            aria-label="Reject mechanic"
                            disabled={actionId === item._id}
                            onClick={() => handleReject(item._id)}
                          >
                            <X size={15} />
                          </button>

                        </div>

                      ) : (

                        <small>
                          {status === "approved"
                            ? "Verified"
                            : "Rejected"}
                        </small>

                      )}

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>


          {!loading && visibleMechanics.length === 0 && (
            <p className="adm-empty">
              No mechanics match your search or selected filters.
            </p>
          )}

        </div>

      </section>

    </AdminLayout>
  );
}

export default AdminMechanics;
