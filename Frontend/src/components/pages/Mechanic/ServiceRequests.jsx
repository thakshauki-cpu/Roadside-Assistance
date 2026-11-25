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
import { getSocket } from "../../../socket";

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

    // Real-time socket updates
    const socket = getSocket();
    if (socket) {
      const handleSocketUpdate = () => {
        loadAllRequests(false);
      };

      socket.on("new_service_request", handleSocketUpdate);
      socket.on("inspection_paid", handleSocketUpdate);
      socket.on("quotation_response", handleSocketUpdate);
      socket.on("repair_payment_completed", handleSocketUpdate);
      socket.on("service_request_updated", handleSocketUpdate);

      return () => {
        active = false;
        clearInterval(pollInterval);
        socket.off("new_service_request", handleSocketUpdate);
        socket.off("inspection_paid", handleSocketUpdate);
        socket.off("quotation_response", handleSocketUpdate);
        socket.off("repair_payment_completed", handleSocketUpdate);
        socket.off("service_request_updated", handleSocketUpdate);
      };
    }

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

  // Step 2: Mechanic submits inspection fee
  const handleSubmitInspectionFee = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await submitInspectionFee(selectedRequest._id, {
        travelFee: Number(travelFee) || 0,
        visitFee: Number(visitFee) || 0,
        inspectionCharge: Number(inspectionCharge) || 0,
        description: inspectionDesc,
      });
      setActionFeedback({ type: "success", message: res.message || "Inspection fee submitted! Waiting for customer payment." });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to submit inspection fee." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 5: Mechanic starts traveling
  const handleStartTravel = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicStartTravel(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Status updated to on the way!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to start travel." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 6: Mechanic marks arrived
  const handleMarkArrived = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicMarkArrived(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Status updated to arrived!" });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to mark arrived." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 7: Mechanic starts inspection
  const handleStartInspection = async () => {
    if (!selectedRequest) return;
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

  // Step 7b: Mechanic completes inspection
  const handleCompleteInspection = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicCompleteInspection(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Inspection completed! You can now submit repair quotation." });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to complete inspection." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 8: Mechanic submits repair quotation
  const handleSubmitRepairQuotation = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await submitRepairQuotation(selectedRequest._id, {
        labourCharge: Number(labourCharge) || 0,
        partsCharge: Number(partsCharge) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        description: repairDesc,
      });
      setActionFeedback({ type: "success", message: res.message || "Repair quotation submitted! Waiting for customer decision." });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to submit repair quotation." });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Step 10: Mechanic marks repair completed
  const handleCompleteRepair = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingAction(true);
      setActionFeedback(null);
      const res = await mechanicCompleteRepair(selectedRequest._id);
      setActionFeedback({ type: "success", message: res.message || "Repair marked as completed! Customer notified for final settlement." });
      await loadAllRequests(false);
    } catch (err) {
      setActionFeedback({ type: "error", message: err.message || "Failed to mark repair completed." });
    } finally {
      setSubmittingAction(false);
    }
  };

  const mechanicName = profile?.user?.fullName || "Mechanic";

  return (
    <div className="mechanic-dashboard">
      <MechanicSidebar
        activeItem="Service Requests"
        pendingCount={pendingRequests.length}
        isAvailable={profile?.isAvailable}
        availabilityLoading={availabilityLoading}
        availabilityUpdating={availabilityUpdating}
        availabilityError={availabilityError}
        onToggleAvailability={profile ? handleToggleAvailability : undefined}
      />

      <main className="mechanic-main">
        <MechanicTopbar mechanicName={mechanicName} showNotifications={false} />

        <div className="service-requests-container">
          <header className="service-requests-header">
            <div>
              <h1>Service Requests Management</h1>
              <p>Manage pending dispatch calls and active assigned roadside jobs.</p>
            </div>

            {/* Tab switch */}
            <div className="sr-tabs" style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`gh-back-button ${activeTab === "pending" ? "active" : ""}`}
                style={{
                  border: activeTab === "pending" ? "2px solid #1453ff" : "1px solid #d1d5db",
                  background: activeTab === "pending" ? "#eef2ff" : "#fff",
                  fontWeight: activeTab === "pending" ? "bold" : "normal",
                }}
                onClick={() => {
                  setActiveTab("pending");
                  setSelectedRequestId(pendingRequests[0]?._id || null);
                }}
              >
                Pending Requests ({pendingRequests.length})
              </button>

              <button
                type="button"
                className={`gh-back-button ${activeTab === "assigned" ? "active" : ""}`}
                style={{
                  border: activeTab === "assigned" ? "2px solid #1453ff" : "1px solid #d1d5db",
                  background: activeTab === "assigned" ? "#eef2ff" : "#fff",
                  fontWeight: activeTab === "assigned" ? "bold" : "normal",
                }}
                onClick={() => {
                  setActiveTab("assigned");
                  setSelectedRequestId(assignedRequests[0]?._id || null);
                }}
              >
                My Assigned Jobs ({assignedRequests.length})
              </button>
            </div>
          </header>

          {actionFeedback && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                background: actionFeedback.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: actionFeedback.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${actionFeedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
              }}
            >
              {actionFeedback.message}
            </div>
          )}

          {requestsLoading && <p>Loading service requests...</p>}
          {requestsError && <p className="form-error">{requestsError}</p>}

          {!requestsLoading && currentRequestsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <Clock size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3>No {activeTab} service requests</h3>
              <p style={{ color: "#64748b" }}>
                {activeTab === "pending"
                  ? "There are currently no new breakdown requests in your zone."
                  : "You do not have any assigned jobs right now. Accept a pending request to begin."}
              </p>
            </div>
          ) : (
            <div className="sr-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px" }}>
              {/* Left Column: List of requests */}
              <div className="sr-list-col">
                {currentRequestsList.map((req) => {
                  const isSelected = req._id === selectedRequest?._id;
                  return (
                    <div
                      key={req._id}
                      onClick={() => setSelectedRequestId(req._id)}
                      style={{
                        padding: "16px",
                        marginBottom: "12px",
                        borderRadius: "12px",
                        background: "#fff",
                        border: isSelected ? "2px solid #1453ff" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 4px 12px rgba(20,83,255,0.1)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px", color: "#1e293b" }}>
                          #{req._id.slice(-6).toUpperCase()}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            background:
                              req.status === "completed"
                                ? "#dcfce7"
                                : req.status === "pending"
                                  ? "#fef3c7"
                                  : "#dbeafe",
                            color:
                              req.status === "completed"
                                ? "#15803d"
                                : req.status === "pending"
                                  ? "#b45309"
                                  : "#1e40af",
                          }}
                        >
                          {req.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>

                      <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                        {req.problem}
                      </p>

                      <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} /> {req.location?.address || "Location unavailable"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Detailed Request Workflow View & Actions */}
              {selectedRequest && (
                <section
                  className="sr-details-col"
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "24px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Service Request Reference:
                        </span>
                        <h2 style={{ margin: "4px 0", fontSize: "20px" }}>
                          #{selectedRequest._id.slice(-6).toUpperCase()}
                        </h2>
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          padding: "6px 14px",
                          borderRadius: "16px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                        }}
                      >
                        Status: {reqStatus.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                      <div>
                        <small style={{ color: "#64748b", display: "block" }}>Customer Name:</small>
                        <strong>{customer?.fullName || "Customer"}</strong>
                      </div>
                      <div>
                        <small style={{ color: "#64748b", display: "block" }}>Mobile Phone:</small>
                        <strong>{customer?.mobile || "Not provided"}</strong>
                      </div>
                      <div>
                        <small style={{ color: "#64748b", display: "block" }}>Vehicle Details:</small>
                        <strong>
                          {vehicle?.vehicleType || "Vehicle"} - {vehicle?.model || "Model"}{" "}
                          ({vehicle?.registrationNumber || "No plate"})
                        </strong>
                      </div>
                      <div>
                        <small style={{ color: "#64748b", display: "block" }}>Breakdown Location:</small>
                        <strong>{selectedRequest.location?.address || "Address unavailable"}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                      <small style={{ color: "#64748b", display: "block" }}>Reported Issue &amp; Notes:</small>
                      <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#1e293b" }}>
                        <strong>{selectedRequest.problem}</strong>
                        {selectedRequest.description ? ` — ${selectedRequest.description}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* ================= WORKFLOW ACTIONS FOR THE SELECTED REQUEST ================= */}
                  <div className="sr-action-zone">
                    {/* A. If Pending: Show Accept and Reject Buttons */}
                    {activeTab === "pending" && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          type="button"
                          className="gh-back-button"
                          style={{ flex: 1, justifyContent: "center" }}
                          onClick={() => handleReject(selectedRequest._id)}
                          disabled={submittingAction}
                        >
                          Decline Request
                        </button>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ flex: 2, justifyContent: "center" }}
                          onClick={() => handleAccept(selectedRequest._id)}
                          disabled={submittingAction}
                        >
                          <Check size={16} />
                          {submittingAction ? "Accepting..." : "Accept Service Request"}
                        </button>
                      </div>
                    )}

                    {/* B. STEP 2: Mechanic Needs to Submit Inspection Fee */}
                    {reqStatus === "accepted" && (
                      <form onSubmit={handleSubmitInspectionFee} style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <ReceiptText color="#1453ff" size={20} />
                          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                            Step 2: Submit Inspection Fee Breakdown
                          </h3>
                        </div>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                          Enter the travelling, location visit, and diagnostic inspection fee for visiting this customer.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Travelling Charge (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={travelFee}
                              onChange={(e) => setTravelFee(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Location Visit Charge (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={visitFee}
                              onChange={(e) => setVisitFee(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Diagnostic Inspection (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={inspectionCharge}
                              onChange={(e) => setInspectionCharge(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Inspection Scope Description:</label>
                          <input
                            type="text"
                            value={inspectionDesc}
                            onChange={(e) => setInspectionDesc(e.target.value)}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                          <strong style={{ fontSize: "15px" }}>
                            Total Inspection Fee: Rs. {(Number(travelFee) + Number(visitFee) + Number(inspectionCharge)).toLocaleString()}
                          </strong>
                          <button type="submit" className="gh-next-button" disabled={submittingAction}>
                            {submittingAction ? "Submitting..." : "Send Inspection Fee to Customer"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* C. STEP 3/4: Inspection Fee Submitted, Waiting for Customer Payment */}
                    {reqStatus === "inspection_fee_submitted" && (
                      <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fef3c7" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <Clock color="#d97706" size={18} />
                          <strong style={{ color: "#92400e" }}>Waiting for Customer Inspection Payment</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
                          Inspection fee of <strong>Rs. {Number(selectedRequest.inspectionFee?.totalAmount || 0).toLocaleString()}</strong> sent to customer.
                          You will be notified immediately once the customer confirms demo payment. Do NOT travel yet.
                        </p>
                      </div>
                    )}

                    {/* D. STEP 5: Customer Paid Inspection Fee -> Mechanic Starts Traveling */}
                    {reqStatus === "inspection_paid" && (
                      <div style={{ background: "#ecfdf5", padding: "18px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <CheckCircle2 color="#059669" size={20} />
                          <strong style={{ color: "#065f46", fontSize: "16px" }}>Inspection Fee Confirmed Paid!</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#047857" }}>
                          The customer has paid the inspection fee of Rs. {Number(selectedRequest.inspectionFee?.totalAmount || 0).toLocaleString()}.
                          You are now authorized to travel to the breakdown location.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleStartTravel}
                          disabled={submittingAction}
                        >
                          <Truck size={16} />
                          {submittingAction ? "Updating..." : "Start Travelling to Customer Location"}
                        </button>
                      </div>
                    )}

                    {/* E. STEP 6: Mechanic Travelling -> Mark Arrived */}
                    {reqStatus === "on_the_way" && (
                      <div style={{ background: "#eff6ff", padding: "18px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Navigation color="#2563eb" size={20} />
                          <strong style={{ color: "#1e40af", fontSize: "16px" }}>Currently Travelling to Location</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#1e3a8a" }}>
                          The customer is tracking your route. Click below once you arrive at the vehicle breakdown spot.
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

                    {/* F. STEP 7a: Arrived -> Start Inspection */}
                    {reqStatus === "arrived" && (
                      <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Wrench color="#475569" size={20} />
                          <strong style={{ color: "#1e293b", fontSize: "16px" }}>Arrived at Breakdown Location</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#475569" }}>
                          Confirm arrival with the vehicle owner and start diagnosing the breakdown.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleStartInspection}
                          disabled={submittingAction}
                        >
                          <Wrench size={16} />
                          {submittingAction ? "Updating..." : "Start Diagnostic Vehicle Inspection"}
                        </button>
                      </div>
                    )}

                    {/* G. STEP 7b: Inspecting -> Complete Inspection */}
                    {reqStatus === "inspecting" && (
                      <div style={{ background: "#fef3c7", padding: "18px", borderRadius: "12px", border: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Wrench color="#b45309" size={20} />
                          <strong style={{ color: "#92400e", fontSize: "16px" }}>Diagnostic Inspection In Progress</strong>
                        </div>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#78350f" }}>
                          Examine the engine, electrical, battery, or mechanical parts. Click below when inspection is done.
                        </p>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center" }}
                          onClick={handleCompleteInspection}
                          disabled={submittingAction}
                        >
                          <CheckCircle2 size={16} />
                          {submittingAction ? "Completing..." : "Complete Vehicle Inspection"}
                        </button>
                      </div>
                    )}

                    {/* H. STEP 8: Inspection Completed -> Submit Repair Quotation */}
                    {reqStatus === "inspection_completed" && (
                      <form onSubmit={handleSubmitRepairQuotation} style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <FileCheck color="#1453ff" size={20} />
                          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                            Step 8: Submit Vehicle Repair Quotation
                          </h3>
                        </div>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                          Provide required repair parts, labour charges, and replacement components discovered during inspection.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Labour Charge (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={labourCharge}
                              onChange={(e) => setLabourCharge(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Parts &amp; Components (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={partsCharge}
                              onChange={(e) => setPartsCharge(e.target.value)}
                              required
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Additional Charges (Rs.):</label>
                            <input
                              type="number"
                              min="0"
                              value={additionalCharges}
                              onChange={(e) => setAdditionalCharges(e.target.value)}
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Repair Description &amp; Details:</label>
                          <input
                            type="text"
                            value={repairDesc}
                            onChange={(e) => setRepairDesc(e.target.value)}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                          <strong style={{ fontSize: "15px" }}>
                            Total Repair Quotation: Rs. {(Number(labourCharge) + Number(partsCharge) + Number(additionalCharges)).toLocaleString()}
                          </strong>
                          <button type="submit" className="gh-next-button" disabled={submittingAction}>
                            {submittingAction ? "Submitting..." : "Send Repair Quotation to Customer"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* I. Quotation Submitted: Waiting for Customer Decision */}
                    {reqStatus === "quotation_submitted" && (
                      <div style={{ marginTop: "20px", background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fef3c7" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <Clock color="#d97706" size={18} />
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
