import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  ReceiptText,
  CreditCard,
  Check,
  FileCheck,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";
import {
  getMechanicProfile,
  getPendingServiceRequests,
  getAssignedServiceRequests,
  acceptServiceRequest,
  rejectServiceRequest,
  updateMechanicAvailability,
  submitInspectionFee,
  mechanicStartTravel,
  mechanicMarkArrived,
  mechanicStartInspection,
  mechanicCompleteInspection,
  submitRepairQuotation,
  mechanicCompleteRepair,
} from "../../../api/mechanic";

import "../../styles/Mechanic/MechanicDashboard.css";
import "../../styles/Mechanic/ServiceRequests.css";

function ServiceRequests() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "assigned"

  const [pendingRequests, setPendingRequests] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(
    location.state?.selectedRequestId || null
  );

  const [actionFeedback, setActionFeedback] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Inspection Fee Form state
  const [travelFee, setTravelFee] = useState("500");
  const [visitFee, setVisitFee] = useState("500");
  const [inspectionCharge, setInspectionCharge] = useState("1000");
  const [inspectionDesc, setInspectionDesc] = useState("Mechanic travelling, location visit & on-site diagnostic inspection");

  // Repair Quotation Form state
  const [labourCharge, setLabourCharge] = useState("3500");
  const [partsCharge, setPartsCharge] = useState("2000");
  const [additionalCharges, setAdditionalCharges] = useState("0");
  const [repairDesc, setRepairDesc] = useState("Diagnostic roadside repair, component replacement & safety test");

  const loadAllRequests = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setRequestsLoading(true);
      const [pendingRes, assignedRes] = await Promise.all([
        getPendingServiceRequests(),
        getAssignedServiceRequests().catch(() => ({ requests: [] })),
      ]);
      setPendingRequests(pendingRes.requests || []);
      setAssignedRequests(assignedRes.requests || []);
      if (isInitial) setRequestsError("");
    } catch (err) {
      if (isInitial) setRequestsError(err.message || "Failed to load service requests.");
    } finally {
      if (isInitial) setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getMechanicProfile()
      .then(({ profile: mechanicProfile }) => {
        if (active) setProfile(mechanicProfile);
      })
      .catch((error) => {
        if (active) setAvailabilityError(error.message);
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });

    loadAllRequests(true);

    // Periodic polling every 4 seconds to reflect customer actions in real time
    const pollInterval = setInterval(() => {
      loadAllRequests(false);
    }, 4000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [loadAllRequests]);

  const handleToggleAvailability = useCallback(async () => {
    if (!profile || availabilityUpdating) return;

    setAvailabilityUpdating(true);
    setAvailabilityError("");
    try {
      const { isAvailable } = await updateMechanicAvailability(!profile.isAvailable);
      setProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, isAvailable } : currentProfile
      );
    } catch (error) {
      setAvailabilityError(error.message);
    } finally {
      setAvailabilityUpdating(false);
    }
  }, [availabilityUpdating, profile]);

  const currentRequestsList = activeTab === "pending" ? pendingRequests : assignedRequests;
  const selectedRequest =
    currentRequestsList.find((r) => r._id === selectedRequestId) || currentRequestsList[0];

  const customer = selectedRequest?.customer;
  const vehicle = selectedRequest?.vehicle;
  const reqStatus = selectedRequest?.status;

  // Accept a pending request
  const handleAccept = async (requestId) => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await acceptServiceRequest(requestId);
      setActionFeedback({ type: "success", message: res.message || "Request accepted!" });
      setActiveTab("assigned");
      setSelectedRequestId(requestId);
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to accept request." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reject a pending request
  const handleReject = async (requestId) => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await rejectServiceRequest(requestId);
      setActionFeedback({ type: "success", message: res.message || "Request rejected." });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to reject request." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 2: Mechanic submits inspection fee
  const handleSubmitInspectionFee = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await submitInspectionFee(selectedRequest._id, {
        travelFee: Number(travelFee),
        visitFee: Number(visitFee),
        inspectionCharge: Number(inspectionCharge),
        description: inspectionDesc,
      });
      setActionFeedback({ type: "success", message: res.message || "Inspection fee submitted!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to submit inspection fee." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 5: Mechanic starts travel (On the way)
  const handleStartTravel = async () => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicStartTravel(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Status updated: On The Way!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to update travel status." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 5: Mechanic marks arrived
  const handleMarkArrived = async () => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicMarkArrived(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Status updated: Arrived!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to mark arrival." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 7: Mechanic starts inspection
  const handleStartInspection = async () => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicStartInspection(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Vehicle inspection started!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to start inspection." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 7: Mechanic completes inspection
  const handleCompleteInspection = async () => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicCompleteInspection(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Vehicle inspection completed!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to complete inspection." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 8: Mechanic submits repair quotation
  const handleSubmitRepairQuotation = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await submitRepairQuotation(selectedRequest._id, {
        labourCharge: Number(labourCharge),
        partsCharge: Number(partsCharge),
        additionalCharges: Number(additionalCharges),
        description: repairDesc,
      });
      setActionFeedback({ type: "success", message: res.message || "Repair quotation submitted!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to submit repair quotation." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 10: Mechanic completes repair
  const handleCompleteRepair = async () => {
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicCompleteRepair(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Repair marked as completed!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to complete repair." });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="service-requests-page">
      <MechanicSidebar
        activeItem="Requests"
        pendingCount={pendingRequests.length}
        isAvailable={profile?.isAvailable}
        availabilityLoading={availabilityLoading}
        availabilityUpdating={availabilityUpdating}
        availabilityError={availabilityError}
        onToggleAvailability={profile ? handleToggleAvailability : undefined}
      />

      <main className="service-main">
        <MechanicTopbar mechanicName={profile?.user?.fullName || "Mechanic"} />

        <div className="service-content">
          <div className="service-title">
            <h1>Service Requests &amp; Jobs</h1>
            <p>Manage roadside assistance dispatches, inspection fees, and vehicle repairs.</p>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              type="button"
              className={`gh-next-button ${activeTab === "pending" ? "" : "gh-back-button"}`}
              style={{
                borderRadius: "10px",
                padding: "10px 18px",
                fontWeight: "bold",
                background: activeTab === "pending" ? "#1453ff" : "#fff",
                color: activeTab === "pending" ? "#fff" : "#1e293b",
                border: "1px solid #cbd5e1",
              }}
              onClick={() => {
                setActiveTab("pending");
                setSelectedRequestId(null);
                setActionFeedback(null);
              }}
            >
              Pending Requests ({pendingRequests.length})
            </button>
            <button
              type="button"
              className={`gh-next-button ${activeTab === "assigned" ? "" : "gh-back-button"}`}
              style={{
                borderRadius: "10px",
                padding: "10px 18px",
                fontWeight: "bold",
                background: activeTab === "assigned" ? "#1453ff" : "#fff",
                color: activeTab === "assigned" ? "#fff" : "#1e293b",
                border: "1px solid #cbd5e1",
              }}
              onClick={() => {
                setActiveTab("assigned");
                setSelectedRequestId(null);
                setActionFeedback(null);
              }}
            >
              My Assigned Jobs ({assignedRequests.length})
            </button>
          </div>

          {actionFeedback && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: actionFeedback.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: actionFeedback.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${actionFeedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {actionFeedback.message}
            </div>
          )}

          {requestsLoading && (
            <p className="service-requests-state" role="status">
              Loading service requests...
            </p>
          )}
          {requestsError && (
            <p className="service-requests-error" role="alert">
              {requestsError}
            </p>
          )}

          {!requestsLoading && !requestsError && currentRequestsList.length === 0 && (
            <p className="service-requests-state">
              {activeTab === "pending"
                ? "There are no pending service requests waiting for acceptance."
                : "You currently have no active assigned service jobs."}
            </p>
          )}

          {!requestsLoading && !requestsError && currentRequestsList.length > 0 && (
            <div className="service-grid">
              {/* Left Column: List of requests */}
              <section className="request-list" aria-label="Requests list">
                {currentRequestsList.map((request) => {
                  const isSelected = request._id === (selectedRequest?._id || selectedRequestId);
                  return (
                    <button
                      key={request._id}
                      type="button"
                      className={`service-request-card ${isSelected ? "selected-request" : ""}`}
                      onClick={() => {
                        setSelectedRequestId(request._id);
                        setActionFeedback(null);
                      }}
                    >
                      <div className="request-header">
                        <div>
                          <strong className="request-id">
                            Request #{request._id.slice(-6).toUpperCase()}
                          </strong>
                          <span
                            className="pending-label"
                            style={{
                              background:
                                request.status === "pending"
                                  ? "#ffedd5"
                                  : request.status === "completed"
                                    ? "#dcfce7"
                                    : "#dbeafe",
                              color:
                                request.status === "pending"
                                  ? "#c2410c"
                                  : request.status === "completed"
                                    ? "#15803d"
                                    : "#1d4ed8",
                            }}
                          >
                            {request.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                          <p>{new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <h3>{request.problem}</h3>
                      <div className="vehicle-number">
                        <strong>
                          {request.vehicle?.registrationNumber || "Registration not provided"}
                        </strong>
                        <span>
                          {request.vehicle?.model || request.vehicle?.vehicleType || "Vehicle"}
                        </span>
                      </div>
                      <div className="problem-box">
                        <p>
                          <AlertTriangle size={14} />
                          {request.description || request.problem}
                        </p>
                        <p>
                          <Navigation size={14} />
                          {request.location?.address || "Location not provided"}
                        </p>
                      </div>
                      <span className="request-customer">
                        Customer: {request.customer?.fullName || "Unavailable"}
                      </span>
                    </button>
                  );
                })}
              </section>

              {/* Right Column: Request Details & Mechanic Actions */}
              {selectedRequest && (
                <section className="incoming-dispatch" aria-label="Selected request details">
                  <div className="dispatch-header">
                    <span className="incoming-label">
                      {reqStatus.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <h2>{selectedRequest.problem}</h2>
                    <p>Submitted {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="dispatch-content">
                    {/* Customer card */}
                    <div className="customer-card">
                      <div className="customer-avatar">
                        {(customer?.fullName || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="customer-info">
                        <strong>{customer?.fullName || "Customer"}</strong>
                        <span>{customer?.mobile || "Phone unavailable"}</span>
                        <small>Customer Contact</small>
                      </div>
                      {customer?.mobile && (
                        <a
                          href={`tel:${customer.mobile.replace(/[^\d+]/g, "")}`}
                          className="customer-call"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                      )}
                    </div>

                    {/* Vehicle & Status details */}
                    <div className="dispatch-information">
                      <div className="information-box">
                        <span>VEHICLE</span>
                        <strong>{vehicle?.model || vehicle?.vehicleType || "Not provided"}</strong>
                        <small>{vehicle?.registrationNumber || "No registration"}</small>
                      </div>
                      <div className="information-box">
                        <span>STATUS</span>
                        <strong>{reqStatus}</strong>
                        <small>{vehicle?.vehicleType || "Vehicle type"}</small>
                      </div>
                    </div>

                    <div className="selected-request-location">
                      <strong><MapPin size={14} /> Location</strong>
                      <span>{selectedRequest.location?.address || "Not provided"}</span>
                      {selectedRequest.location?.landmark && (
                        <small>Landmark: {selectedRequest.location.landmark}</small>
                      )}
                    </div>

                    {selectedRequest.description && (
                      <p className="selected-request-description">
                        Note: {selectedRequest.description}
                      </p>
                    )}

                    {/* =====================================================
                        ACTION SECTIONS DEPENDING ON STATUS
                        ===================================================== */}

                    {/* A. Pending status: Accept / Reject */}
                    {activeTab === "pending" && reqStatus === "pending" && (
                      <div className="dispatch-buttons" style={{ marginTop: "20px" }}>
                        <button
                          type="button"
                          className="dispatch-decline"
                          onClick={() => handleReject(selectedRequest._id)}
                          disabled={submittingAction}
                        >
                          Decline Request
                        </button>
                        <button
                          type="button"
                          className="dispatch-accept"
                          onClick={() => handleAccept(selectedRequest._id)}
                          disabled={submittingAction}
                        >
                          {submittingAction ? "Processing..." : "Accept Request"}
                        </button>
                      </div>
                    )}

                    {/* B. Assigned / Accepted: Submit Inspection Fee */}
                    {activeTab === "assigned" && ["accepted", "assigned"].includes(reqStatus) && (
                      <div style={{ marginTop: "20px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 8px", color: "#1e293b" }}>STEP 2: Submit Inspection Fee</h4>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
                          Enter travelling, location visit, and vehicle inspection charges. Customer will demo pay this fee before you travel.
                        </p>
                        <form onSubmit={handleSubmitInspectionFee}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Travelling Fee (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={travelFee}
                                onChange={(e) => setTravelFee(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Location Visit (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={visitFee}
                                onChange={(e) => setVisitFee(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Inspection Fee (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={inspectionCharge}
                                onChange={(e) => setInspectionCharge(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                          </div>
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Description / Notes</label>
                            <input
                              type="text"
                              value={inspectionDesc}
                              onChange={(e) => setInspectionDesc(e.target.value)}
                              style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "10px", background: "#eff6ff", borderRadius: "8px" }}>
                            <strong>Total Inspection Charge:</strong>
                            <strong style={{ color: "#1d4ed8", fontSize: "16px" }}>
                              Rs. {(Number(travelFee || 0) + Number(visitFee || 0) + Number(inspectionCharge || 0)).toLocaleString()}
                            </strong>
                          </div>
                          <button
                            type="submit"
                            className="gh-next-button"
                            style={{ width: "100%", justifyContent: "center" }}
                            disabled={submittingAction}
                          >
                            {submittingAction ? "Submitting..." : "Send Inspection Fee to Customer"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* C. Waiting for Customer Inspection Payment */}
                    {reqStatus === "inspection_fee_submitted" && (
                      <div style={{ marginTop: "20px", background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <Clock color="#b45309" size={18} />
                          <strong style={{ color: "#92400e" }}>Waiting for Customer Inspection Payment</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
                          Inspection fee of <strong>Rs. {Number(selectedRequest.inspectionFee?.totalAmount || 0).toLocaleString()}</strong> submitted.
                          Per business rules, you cannot start traveling until the customer confirms demo payment.
                        </p>
                      </div>
                    )}

                    {/* D. STEP 5: Inspection Paid - Ready to Travel */}
                    {reqStatus === "inspection_paid" && (
                      <div style={{ marginTop: "20px", background: "#f0fdf4", padding: "18px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <CheckCircle2 color="#166534" size={20} />
                          <strong style={{ color: "#166534", fontSize: "16px" }}>Inspection Fee Paid! Ready for Dispatch</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#1e3a8a" }}>
                          Customer has confirmed demo payment of Rs. {Number(selectedRequest.inspectionPayment?.amount || 0).toLocaleString()}.
                          You can now start travelling to the breakdown location.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleStartTravel}
                          disabled={submittingAction}
                        >
                          <Truck size={16} />
                          {submittingAction ? "Updating..." : "Start Travelling (On The Way)"}
                        </button>
                      </div>
                    )}

                    {/* E. In Transit: Mark Arrived */}
                    {reqStatus === "on_the_way" && (
                      <div style={{ marginTop: "20px", background: "#eff6ff", padding: "18px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Truck color="#1d4ed8" size={20} />
                          <strong style={{ color: "#1e40af", fontSize: "16px" }}>You are On The Way</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#1e3a8a" }}>
                          The customer is tracking your dispatch in real-time. Update your status once you arrive on site.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleMarkArrived}
                          disabled={submittingAction}
                        >
                          <MapPin size={16} />
                          {submittingAction ? "Updating..." : "Mark Arrived at Breakdown Location"}
                        </button>
                      </div>
                    )}

                    {/* F. Arrived: Start Inspection */}
                    {reqStatus === "arrived" && (
                      <div style={{ marginTop: "20px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                        <h4 style={{ margin: "0 0 8px", color: "#1e293b" }}>STEP 7: Start Vehicle Inspection</h4>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
                          You have arrived. Begin vehicle diagnostic examination and inspection.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleStartInspection}
                          disabled={submittingAction}
                        >
                          <Wrench size={16} />
                          {submittingAction ? "Starting..." : "Start Vehicle Inspection"}
                        </button>
                      </div>
                    )}

                    {/* G. Inspecting: Complete Inspection */}
                    {reqStatus === "inspecting" && (
                      <div style={{ marginTop: "20px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                        <h4 style={{ margin: "0 0 8px", color: "#1e293b" }}>STEP 7: Complete Vehicle Inspection</h4>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
                          Inspection in progress. Complete the diagnostic check to unlock the repair quotation form.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleCompleteInspection}
                          disabled={submittingAction}
                        >
                          <Check size={16} />
                          {submittingAction ? "Completing..." : "Complete Vehicle Inspection"}
                        </button>
                      </div>
                    )}

                    {/* H. STEP 8: Inspection Completed - Submit Repair Quotation */}
                    {reqStatus === "inspection_completed" && (
                      <div style={{ marginTop: "20px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                        <h4 style={{ margin: "0 0 8px", color: "#1e293b" }}>STEP 8: Submit Repair Quotation</h4>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
                          Inspection is complete. Enter the repair charges for customer review and authorization.
                        </p>
                        <form onSubmit={handleSubmitRepairQuotation}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Labour Charge (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={labourCharge}
                                onChange={(e) => setLabourCharge(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Spare Parts (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={partsCharge}
                                onChange={(e) => setPartsCharge(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Additional Charges (Rs.)</label>
                              <input
                                type="number"
                                min="0"
                                value={additionalCharges}
                                onChange={(e) => setAdditionalCharges(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                            </div>
                          </div>
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Repair Description</label>
                            <textarea
                              rows={2}
                              value={repairDesc}
                              onChange={(e) => setRepairDesc(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "10px", background: "#eff6ff", borderRadius: "8px" }}>
                            <strong>Total Repair Fee:</strong>
                            <strong style={{ color: "#15803d", fontSize: "16px" }}>
                              Rs. {(Number(labourCharge || 0) + Number(partsCharge || 0) + Number(additionalCharges || 0)).toLocaleString()}
                            </strong>
                          </div>
                          <button
                            type="submit"
                            className="gh-next-button"
                            style={{ width: "100%", justifyContent: "center" }}
                            disabled={submittingAction}
                          >
                            {submittingAction ? "Submitting..." : "Submit Repair Quotation to Customer"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* I. Quotation Submitted: Waiting for Customer Decision */}
                    {reqStatus === "quotation_submitted" && (
                      <div style={{ marginTop: "20px", background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <Clock color="#b45309" size={18} />
                          <strong style={{ color: "#92400e" }}>Waiting for Customer Quotation Approval</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
                          Repair quotation of <strong>Rs. {Number(selectedRequest.repairQuotation?.totalAmount || 0).toLocaleString()}</strong> sent.
                          Do NOT begin repair work until the customer accepts the quotation.
                        </p>
                      </div>
                    )}

                    {/* J. Customer Rejected Repair Quotation */}
                    {reqStatus === "repair_rejected" && (
                      <div style={{ marginTop: "20px", background: "#fef2f2", padding: "16px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <AlertTriangle color="#dc2626" size={18} />
                          <strong style={{ color: "#991b1b" }}>Customer Rejected Repair Quotation</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#7f1d1d" }}>
                          The customer declined the repair quotation. Do not perform repair work. The service is concluded with the inspection fee only.
                        </p>
                      </div>
                    )}

                    {/* K. Customer Accepted: Repair In Progress */}
                    {reqStatus === "repair_in_progress" && (
                      <div style={{ marginTop: "20px", background: "#f0fdf4", padding: "18px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <CheckCircle2 color="#166534" size={20} />
                          <strong style={{ color: "#166534", fontSize: "16px" }}>Customer Accepted Repair Quotation!</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#14532d" }}>
                          Repair work is officially authorized. Mark as completed once repairs and functional testing are done.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleCompleteRepair}
                          disabled={submittingAction}
                        >
                          <Check size={16} />
                          {submittingAction ? "Completing..." : "Complete Repair Work"}
                        </button>
                      </div>
                    )}

                    {/* L. Repair Completed: Waiting for Final Repair Settlement */}
                    {reqStatus === "repair_completed" && (
                      <div style={{ marginTop: "20px", background: "#eff6ff", padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <Clock color="#1d4ed8" size={18} />
                          <strong style={{ color: "#1e40af" }}>Waiting for Final Repair Fee Demo Payment</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a" }}>
                          Repair work is finished. Waiting for customer to confirm final settlement of{" "}
                          <strong>Rs. {Number(selectedRequest.repairQuotation?.totalAmount || 0).toLocaleString()}</strong>.
                        </p>
                      </div>
                    )}

                    {/* M. Job Fully Completed */}
                    {reqStatus === "completed" && (
                      <div style={{ marginTop: "20px", background: "#ecfdf5", padding: "16px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <CheckCircle2 color="#059669" size={18} />
                          <strong style={{ color: "#065f46" }}>Job Fully Completed &amp; Settled!</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#065f46" }}>
                          Both inspection fee and final repair fee have been successfully paid and recorded in MongoDB.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ServiceRequests;
