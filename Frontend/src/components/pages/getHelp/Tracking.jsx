import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navigation,
  LocateFixed,
  BadgeCheck,
  Star,
  Timer,
  Phone,
  MessageSquare,
  Share2,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  AlertTriangle,
  ReceiptText,
  Wrench,
  X,
} from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import {
  getAssignment,
  getTracking,
  payInspectionFee,
  respondToRepairQuotation,
} from "../../../api/getHelp";
import {
  getCreatedRequestId,
  readRequest,
} from "./requestSampleData";
import { getSocket, joinRequestRoom, leaveRequestRoom } from "../../../socket";
import "../../styles/GetHelp.css";
import "../../styles/Tracking.css";
import "leaflet/dist/leaflet.css";

const toMapPoint = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;

  const [longitude, latitude] = coordinates.map(Number);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [latitude, longitude];
};

function FitTrackingMap({ pointsKey }) {
  const map = useMap();

  useEffect(() => {
    const points = pointsKey
      .split(";")
      .filter(Boolean)
      .map((point) => point.split(",").map(Number));

    if (points.length > 1) {
      map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, pointsKey]);

  return null;
}

function Tracking() {
  const navigate = useNavigate();
  const requestId = getCreatedRequestId();
  const saved = readRequest();
  const plate = saved.vehicle?.registrationNumber || "Vehicle";
  const [notice, setNotice] = useState("");
  const [tracking, setTracking] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Poll backend for real tracking updates
  const loadTrackingData = useCallback(async (isInitial = false) => {
    try {
      if (!requestId) {
        throw new Error("Your service request is missing. Please submit it again.");
      }
      const [trackingData, assignmentData] = await Promise.all([
        getTracking(requestId),
        getAssignment(requestId),
      ]);
      setTracking(trackingData);
      setAssignment(assignmentData);
      if (isInitial) setError("");
    } catch (loadError) {
      if (isInitial) setError(loadError.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    Promise.resolve().then(() => loadTrackingData(true));

    // Periodic API polling every 3 seconds for live status updates
    const pollInterval = setInterval(() => {
      loadTrackingData(false);
    }, 3000);

    // Socket.io real-time updates
    const socket = getSocket();
    if (socket && requestId) {
      joinRequestRoom(requestId);

      const handleUpdate = () => {
        loadTrackingData(false);
      };

      socket.on("service_request_updated", handleUpdate);
      socket.on("mechanic_status_update", handleUpdate);
      socket.on("quotation_received", handleUpdate);
      socket.on("repair_completed", handleUpdate);

      return () => {
        clearInterval(pollInterval);
        leaveRequestRoom(requestId);
        socket.off("service_request_updated", handleUpdate);
        socket.off("mechanic_status_update", handleUpdate);
        socket.off("quotation_received", handleUpdate);
        socket.off("repair_completed", handleUpdate);
      };
    }

    return () => clearInterval(pollInterval);
  }, [loadTrackingData, requestId]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotice("Tracking link copied. You can paste it to family or your insurer.");
    } catch {
      showNotice("Copy is not available in this browser.");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Do you want to cancel this request?")) {
      localStorage.removeItem("serviceRequest");
      localStorage.removeItem("createdServiceRequest");
      navigate("/dashboard");
    }
  };

  // Customer responds to Repair Quotation (Accept / Reject)
  const handleRepairResponse = async (response) => {
    try {
      setActionLoading(true);
      setError("");
      await respondToRepairQuotation(requestId, {
        response,
        rejectionReason: response === "rejected" ? rejectionReason : "",
      });
      showNotice(
        response === "accepted"
          ? "Repair quotation accepted! Mechanic has started repair."
          : "Repair quotation rejected. Only inspection fee applies."
      );
      setShowRejectInput(false);
      await loadTrackingData(false);
    } catch (err) {
      setError(err.message || "Failed to submit repair quotation response.");
    } finally {
      setActionLoading(false);
    }
  };

  // Customer demo pays inspection fee if pending
  const handlePayInspectionDemo = async () => {
    try {
      setActionLoading(true);
      setError("");
      await payInspectionFee(requestId, { paymentMethod: "card" });
      showNotice("Inspection fee demo payment confirmed! Mechanic notified.");
      await loadTrackingData(false);
    } catch (err) {
      setError(err.message || "Failed to pay inspection fee.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !tracking) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading live service tracking...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const mechanic = tracking.mechanic || assignment?.mechanic || {
    name: "Assigned Technician",
    phone: "+94 77 123 4567",
    rating: 4.8,
    ratingCount: 88,
  };

  const currentStatus = tracking.status || "accepted";

  // Determine stage flags
  const isInspectionFeeSubmitted = [
    "inspection_fee_submitted",
    "inspection_paid",
    "on_the_way",
    "arrived",
    "inspecting",
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isInspectionPaid = [
    "inspection_paid",
    "on_the_way",
    "arrived",
    "inspecting",
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isOnTheWay = [
    "on_the_way",
    "arrived",
    "inspecting",
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const hasArrived = [
    "arrived",
    "inspecting",
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isInspecting = [
    "inspecting",
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isInspectionCompleted = [
    "inspection_completed",
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isQuotationSubmitted = [
    "quotation_submitted",
    "repair_in_progress",
    "repair_rejected",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isRepairInProgress = [
    "repair_in_progress",
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isRepairRejected = currentStatus === "repair_rejected";

  const isRepairCompleted = [
    "repair_completed",
    "completed",
  ].includes(currentStatus);

  const isRepairPaid = currentStatus === "completed";

  const customerCoordinates =
    tracking.serviceRequest?.location?.coordinates ||
    saved.location?.coordinates;
  const customerMapPoint = toMapPoint(customerCoordinates);
  const mechanicBasePoint = toMapPoint(mechanic.coordinates);
  const mechanicMapPoint =
    hasArrived && customerMapPoint ? customerMapPoint : mechanicBasePoint;
  const customerLatitude = customerMapPoint?.[0];
  const customerLongitude = customerMapPoint?.[1];
  const mechanicLatitude = mechanicMapPoint?.[0];
  const mechanicLongitude = mechanicMapPoint?.[1];
  const mapPoints = [];
  if (customerLatitude !== undefined && customerLongitude !== undefined) {
    mapPoints.push([customerLatitude, customerLongitude]);
  }
  if (mechanicLatitude !== undefined && mechanicLongitude !== undefined) {
    const mechanicPoint = [mechanicLatitude, mechanicLongitude];
    if (
      !mapPoints.some(
        ([latitude, longitude]) =>
          latitude === mechanicLatitude && longitude === mechanicLongitude
      )
    ) {
      mapPoints.push(mechanicPoint);
    }
  }
  const mapPointsKey = mapPoints.map((point) => point.join(",")).join(";");
  const routePoints =
    isOnTheWay && !hasArrived && customerMapPoint && mechanicBasePoint
      ? [mechanicBasePoint, customerMapPoint]
      : null;

  // Steps matching business workflow
  const steps = [
    {
      title: "1. Inspection Fee Submitted",
      detail: isInspectionFeeSubmitted
        ? `Fee: Rs. ${Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}`
        : "Awaiting mechanic inspection fee",
      done: isInspectionFeeSubmitted,
      active: currentStatus === "inspection_fee_submitted",
    },
    {
      title: "2. Inspection Fee Paid",
      detail: isInspectionPaid
        ? `Paid via Demo ${tracking.inspectionPayment?.paymentMethod || "Card"}`
        : "Customer payment required",
      done: isInspectionPaid,
      active: currentStatus === "inspection_fee_submitted",
    },
    {
      title: "3. Mechanic Traveling",
      detail: isOnTheWay ? "En route to breakdown location" : "Awaiting dispatch",
      done: isOnTheWay,
      active: currentStatus === "on_the_way",
    },
    {
      title: "4. Mechanic Arrived",
      detail: hasArrived ? "Technician on-site" : "In transit",
      done: hasArrived,
      active: currentStatus === "arrived",
    },
    {
      title: "5. Vehicle Inspection",
      detail: isInspecting ? "Diagnostic inspection active" : "Pending arrival",
      done: isInspectionCompleted,
      active: currentStatus === "inspecting",
    },
    {
      title: "6. Repair Quotation",
      detail: isQuotationSubmitted
        ? isRepairRejected
          ? "Customer Rejected Quotation"
          : isRepairInProgress
          ? "Accepted by Customer"
          : `Quotation: Rs. ${Number(tracking.repairQuotation?.totalAmount || 0).toLocaleString()}`
        : "Pending inspection completion",
      done: isQuotationSubmitted,
      active: currentStatus === "quotation_submitted",
    },
    {
      title: "7. Vehicle Repair",
      detail: isRepairRejected
        ? "Repair cancelled (Quotation rejected)"
        : isRepairCompleted
        ? "Repairs finished & tested"
        : isRepairInProgress
        ? "Repair work in progress"
        : "Awaiting quotation response",
      done: isRepairCompleted || isRepairRejected,
      active: currentStatus === "repair_in_progress",
    },
    {
      title: "8. Final Payment & Completion",
      detail: isRepairPaid
        ? "Full service settled"
        : isRepairCompleted
        ? "Pending final repair settlement"
        : "Final stage",
      done: isRepairPaid,
      active: currentStatus === "repair_completed",
    },
  ];

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          {/* Top strip */}
          <div className="summary-strip">
            <span className="summary-chip green">● Live Service Tracking</span>
            <span>{saved.location?.address || "Breakdown Location"}</span>
            <strong className="summary-step">
              <ShieldAlert size={13} /> {tracking.requestReference}
            </strong>
          </div>

          <RequestStepper currentStep={5} />

          {/* Heading */}
          <div className="track-header">
            <div>
              <h2>Service Progress &amp; Mechanic Tracking</h2>
              <p>Vehicle: {plate} · Status: {currentStatus.replace(/_/g, " ").toUpperCase()}</p>
            </div>
            <span className="live-status-pill">
              ● Live Updates Active
            </span>
          </div>

          {/* STEP 3 PROMPT: If inspection fee needs payment */}
          {currentStatus === "inspection_fee_submitted" && !isInspectionPaid && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <AlertTriangle color="#d97706" size={20} />
                <strong style={{ color: "#b45309", fontSize: "16px" }}>Inspection Fee Payment Required</strong>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#78350f" }}>
                The mechanic has submitted an inspection fee of <strong>Rs. {Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}</strong>.
                The mechanic cannot travel until this fee is confirmed.
              </p>
              <button
                type="button"
                className="gh-next-button"
                onClick={handlePayInspectionDemo}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing Demo Payment..." : `Pay Inspection Fee (Demo) - Rs. ${Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}`}
              </button>
            </div>
          )}

          {/* STEP 8 & 9: Repair Quotation Decision Card */}
          {currentStatus === "quotation_submitted" && tracking.repairQuotation && (
            <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "14px", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(22, 101, 52, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ReceiptText color="#15803d" size={22} />
                  <h3 style={{ margin: 0, color: "#166534", fontSize: "18px" }}>Official Repair Quotation Received</h3>
                </div>
                <span style={{ background: "#bbf7d0", color: "#166534", padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: "bold" }}>
                  Action Required
                </span>
              </div>

              <p style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: "13px" }}>
                Your mechanic has inspected the vehicle and submitted the following repair estimate. The mechanic will NOT begin work without your explicit acceptance.
              </p>

              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #dcfce7", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span style={{ color: "#4b5563" }}>Labour Charge:</span>
                  <strong>Rs. {Number(tracking.repairQuotation.labourCharge || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span style={{ color: "#4b5563" }}>Spare Parts &amp; Consumables:</span>
                  <strong>Rs. {Number(tracking.repairQuotation.partsCharge || 0).toLocaleString()}</strong>
                </div>
                {tracking.repairQuotation.additionalCharges > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                    <span style={{ color: "#4b5563" }}>Additional Charges:</span>
                    <strong>Rs. {Number(tracking.repairQuotation.additionalCharges || 0).toLocaleString()}</strong>
                  </div>
                )}
                {tracking.repairQuotation.description && (
                  <div style={{ margin: "8px 0", padding: "8px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px", color: "#334155" }}>
                    <em>"{tracking.repairQuotation.description}"</em>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "2px dashed #e2e8f0", fontSize: "16px" }}>
                  <strong style={{ color: "#111827" }}>TOTAL REPAIR FEE:</strong>
                  <strong style={{ color: "#15803d" }}>Rs. {Number(tracking.repairQuotation.totalAmount || 0).toLocaleString()}</strong>
                </div>
              </div>

              {error && <p className="form-error" role="alert" style={{ marginBottom: "12px" }}>{error}</p>}

              {showRejectInput ? (
                <div style={{ background: "#fff", padding: "14px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#991b1b" }}>
                    Reason for rejecting repair quotation (optional):
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Too expensive, towing elsewhere, etc."
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "10px", fontSize: "13px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="gh-back-button"
                      onClick={() => setShowRejectInput(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={{ background: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                      onClick={() => handleRepairResponse("rejected")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Submitting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="gh-back-button"
                    style={{ borderColor: "#dc2626", color: "#dc2626" }}
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                  >
                    <X size={16} />
                    Reject Repair Quotation
                  </button>

                  <button
                    type="button"
                    className="gh-next-button"
                    style={{ background: "#15803d" }}
                    onClick={() => handleRepairResponse("accepted")}
                    disabled={actionLoading}
                  >
                    <Check size={16} />
                    {actionLoading ? "Accepting..." : "Accept Repair & Authorize Work"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* If repair was rejected: inform customer */}
          {currentStatus === "repair_rejected" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <AlertTriangle color="#dc2626" size={18} />
                <strong style={{ color: "#991b1b" }}>Repair Quotation Rejected</strong>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#7f1d1d" }}>
                You rejected the repair quotation. No repair work will be done. You are only charged the initial inspection fee of Rs. {Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()} (already paid).
              </p>
              <button
                type="button"
                className="gh-next-button"
                onClick={() => navigate("/get-help/summary")}
              >
                View Final Summary
              </button>
            </div>
          )}

          <div className="track-grid">
            {/* Left Column: Interactive Map & Workflow Card */}
            <div className="track-left">
              {/* Map panel */}
              <section className="track-map-card">
                <div className="track-map-wrap">
                  {mapPoints.length > 0 ? (
                    <MapContainer
                      center={mapPoints[0]}
                      zoom={mapPoints.length > 1 ? 12 : 14}
                      scrollWheelZoom={false}
                      className="track-leaflet-map"
                    >
                      <FitTrackingMap pointsKey={mapPointsKey} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {routePoints && (
                        <Polyline
                          positions={routePoints}
                          pathOptions={{
                            color: "#2055f5",
                            dashArray: "8 8",
                            weight: 5,
                          }}
                        />
                      )}
                      {customerMapPoint && (
                        <CircleMarker
                          center={customerMapPoint}
                          radius={14}
                          pathOptions={{
                            color: "#2055f5",
                            fillColor: "#2055f5",
                            fillOpacity: 0.2,
                            weight: 4,
                          }}
                        >
                          <Tooltip>Customer-selected location</Tooltip>
                        </CircleMarker>
                      )}
                      {mechanicMapPoint && (
                        <CircleMarker
                          center={mechanicMapPoint}
                          radius={7}
                          pathOptions={{
                            color: "#ffffff",
                            fillColor: "#dc2626",
                            fillOpacity: 1,
                            weight: 3,
                          }}
                        >
                          <Tooltip>
                            {hasArrived
                              ? "Mechanic arrived at customer location"
                              : "Mechanic workshop starting location"}
                          </Tooltip>
                        </CircleMarker>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="track-map-empty" role="status">
                      Location coordinates are unavailable for this request.
                    </div>
                  )}

                  <div className="track-map-overlay">
                    <span className="track-eta-chip">
                      <Timer size={14} />
                      {hasArrived
                        ? "Technician On-Site"
                        : isOnTheWay
                        ? "Mechanic Traveling (ETA ~8 mins)"
                        : isInspectionPaid
                        ? "Payment Confirmed - Dispatching Mechanic"
                        : "Inspection Payment Required"}
                    </span>
                  </div>
                </div>

                <div className="track-map-bar">
                  <div className="track-speed-info">
                    <Navigation size={15} />
                    <span>
                      Location: {tracking.serviceRequest?.location?.address ||
                        saved.location?.address ||
                        "Address unavailable"}
                    </span>
                  </div>
                  <div className="track-controls">
                    <button type="button" onClick={() => showNotice("Map re-centered to your vehicle.")}>
                      <LocateFixed size={15} /> Locate
                    </button>
                  </div>
                </div>
                <div className="track-map-legend" aria-label="Map markers">
                  {customerMapPoint && (
                    <span>
                      <i className="track-legend-dot customer" />
                      Customer-selected location
                    </span>
                  )}
                  {mechanicMapPoint && (
                    <span>
                      <i className="track-legend-dot mechanic" />
                      {hasArrived
                        ? "Mechanic at customer location"
                        : "Mechanic workshop location"}
                    </span>
                  )}
                </div>
                {(!customerMapPoint || (!mechanicBasePoint && !hasArrived)) && (
                  <p className="track-map-note" role="status">
                    {!customerMapPoint
                      ? "The customer location coordinates are missing. The map cannot show the selected pickup point."
                      : "The mechanic's workshop coordinates are missing. The mechanic marker will appear at the customer location after arrival is reported."}
                  </p>
                )}
                {hasArrived && customerMapPoint && (
                  <p className="track-map-note arrived" role="status">
                    The mechanic reported arrival. Both map markers now indicate your selected location.
                  </p>
                )}
              </section>

              {/* ACTION CARD: Step-Specific Action Banners */}
              {/* 1. If inspection fee was submitted but customer hasn't paid */}
              {currentStatus === "inspection_fee_submitted" && !isInspectionPaid && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "12px", padding: "18px", marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <AlertTriangle color="#d97706" size={20} />
                    <strong style={{ color: "#92400e", fontSize: "16px" }}>
                      Inspection Fee Payment Required
                    </strong>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#78350f" }}>
                    The mechanic submitted an inspection fee of{" "}
                    <strong>Rs. {Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}</strong>.
                    You must pay this fee before the mechanic is authorized to travel.
                  </p>
                  <button
                    type="button"
                    className="gh-next-button"
                    onClick={handlePayInspectionDemo}
                    disabled={actionLoading}
                  >
                    <CreditCard size={16} />
                    {actionLoading ? "Processing..." : `Pay Inspection Fee (Demo) - Rs. ${Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}`}
                  </button>
                </div>
              )}

              {/* 2. Customer needs to respond to Repair Quotation */}
              {currentStatus === "quotation_submitted" && (
                <div style={{ background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: "14px", padding: "20px", marginTop: "16px", boxShadow: "0 4px 12px rgba(34,197,94,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px" }}>
                        ACTION REQUIRED
                      </span>
                      <h3 style={{ margin: "8px 0 4px", fontSize: "18px", color: "#14532d" }}>
                        Vehicle Repair Quotation Received
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                        The technician inspected your vehicle and submitted the quotation below.
                      </p>
                    </div>
                    <strong style={{ fontSize: "22px", color: "#15803d" }}>
                      Rs. {Number(tracking.repairQuotation?.totalAmount || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div style={{ background: "#ffffff", borderRadius: "10px", padding: "14px", marginBottom: "16px", border: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                      <span>Labour Charge:</span>
                      <strong>Rs. {Number(tracking.repairQuotation?.labourCharge || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                      <span>Parts &amp; Components:</span>
                      <strong>Rs. {Number(tracking.repairQuotation?.partsCharge || 0).toLocaleString()}</strong>
                    </div>
                    {tracking.repairQuotation?.additionalCharges > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                        <span>Additional Charges:</span>
                        <strong>Rs. {Number(tracking.repairQuotation.additionalCharges).toLocaleString()}</strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "14px" }}>
                      <strong>Total Estimated Repair:</strong>
                      <strong style={{ color: "#15803d" }}>
                        Rs. {Number(tracking.repairQuotation?.totalAmount || 0).toLocaleString()}
                      </strong>
                    </div>
                    {tracking.repairQuotation?.description && (
                      <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#4b5563" }}>
                        <em>Notes: {tracking.repairQuotation.description}</em>
                      </p>
                    )}
                  </div>

                  {showRejectInput ? (
                    <div>
                      <textarea
                        rows="2"
                        placeholder="Please provide reason for rejecting this quotation..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "10px", fontSize: "13px" }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          className="gh-back-button"
                          onClick={() => setShowRejectInput(false)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ background: "#dc2626", color: "#fff" }}
                          onClick={() => handleRepairResponse("rejected")}
                          disabled={actionLoading}
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        className="gh-back-button"
                        onClick={() => setShowRejectInput(true)}
                        disabled={actionLoading}
                      >
                        <X size={16} /> Reject Quotation
                      </button>
                      <button
                        type="button"
                        className="gh-next-button"
                        onClick={() => handleRepairResponse("accepted")}
                        disabled={actionLoading}
                      >
                        <Check size={16} /> Accept Repair Quotation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Repair in progress alert */}
              {currentStatus === "repair_in_progress" && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Wrench color="#2563eb" size={18} />
                    <strong style={{ color: "#1e40af" }}>Vehicle Repair In Progress</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e3a8a" }}>
                    You accepted the repair quotation. The technician is currently carrying out the required repairs.
                  </p>
                </div>
              )}

              {/* 4. Repair rejected alert */}
              {isRepairRejected && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <AlertTriangle color="#dc2626" size={18} />
                    <strong style={{ color: "#991b1b" }}>Repair Quotation Declined</strong>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#7f1d1d" }}>
                    You rejected the repair quotation. Only the initial inspection fee was billed.
                  </p>
                  <button
                    type="button"
                    className="gh-next-button"
                    onClick={() => navigate("/get-help/summary")}
                  >
                    View Concluded Summary
                  </button>
                </div>
              )}

              {/* 5. Repair Completed: Next step is settlement */}
              {isRepairCompleted && !isRepairPaid && !isRepairRejected && (
                <div style={{ background: "#ecfdf5", border: "2px solid #10b981", borderRadius: "12px", padding: "18px", marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Check color="#059669" size={20} />
                    <strong style={{ color: "#065f46", fontSize: "16px" }}>Vehicle Repair Completed!</strong>
                  </div>
                  <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#047857" }}>
                    The mechanic has concluded the repairs. Please proceed to the final demo payment and service review.
                  </p>
                  <button
                    type="button"
                    className="gh-next-button"
                    onClick={() => navigate("/get-help/summary")}
                  >
                    Proceed to Final Settlement &amp; Review
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Workflow Stepper Details */}
              <section className="gethelp-card" style={{ marginTop: "18px" }}>
                <h3 style={{ fontSize: "15px", marginBottom: "14px", color: "#1e293b" }}>
                  Workflow Milestones
                </h3>
                <div className="track-step-list">
                  {steps.map((st, idx) => (
                    <div
                      key={st.title}
                      className={`track-step-item ${st.done ? "done" : st.active ? "active" : ""}`}
                    >
                      <div className="step-circle">
                        {st.done ? <Check size={13} /> : idx + 1}
                      </div>
                      <div className="step-content">
                        <strong>{st.title}</strong>
                        <p>{st.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Mechanic Profile, Emergency Info, Fees */}
            <div className="track-right">
              {/* Mechanic card */}
              <section className="gethelp-card track-mechanic-card">
                <div className="track-mechanic-top">
                  <div className="track-mechanic-avatar">
                    {mechanic.name?.charAt(0) || "T"}
                  </div>
                  <div>
                    <h3>{mechanic.name || "Assigned Technician"}</h3>
                    <span className="track-mech-verified">
                      <BadgeCheck size={13} /> RoadMate Verified Partner
                    </span>
                    <p className="track-mech-rating">
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <strong>{mechanic.rating || 4.8}</strong> ({mechanic.ratingCount || 12} reviews)
                    </p>
                  </div>
                </div>

                <div className="track-mechanic-details">
                  <div>
                    <span>SPECIALTY</span>
                    <strong>{mechanic.specialty || "Automotive Diagnostics"}</strong>
                  </div>
                  <div>
                    <span>BREAKDOWN VEHICLE</span>
                    <strong>{plate}</strong>
                  </div>
                </div>

                <div className="track-actions-row">
                  {mechanic.phone ? (
                    <a href={`tel:${mechanic.phone}`} className="track-call">
                      <Phone size={16} /> Call Mechanic
                    </a>
                  ) : (
                    <button type="button" className="track-call" onClick={() => showNotice("Phone number unavailable.")}>
                      <Phone size={16} /> Call Mechanic
                    </button>
                  )}
                  <button type="button" className="track-message" onClick={() => showNotice("Direct chat will be enabled shortly.")}>
                    <MessageSquare size={16} /> Message
                  </button>
                </div>

                <button type="button" className="track-share" onClick={handleShare}>
                  <Share2 size={14} /> Share Live Status
                </button>
              </section>

              {/* Fees Summary Card */}
              <section className="gethelp-card" style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", fontSize: "14px", marginBottom: "12px", color: "#1e293b" }}>
                  <ReceiptText size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                  Billing &amp; Payment Summary
                </strong>

                {/* Inspection Fee line */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Inspection Fee:</span>
                  <span style={{ fontWeight: "bold", color: isInspectionPaid ? "#15803d" : "#b45309" }}>
                    Rs. {Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}{" "}
                    {isInspectionPaid ? "✓ Paid" : "(Pending)"}
                  </span>
                </div>

                {/* Repair Fee line */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Repair Fee:</span>
                  <span style={{ fontWeight: "bold", color: isRepairPaid ? "#15803d" : isRepairRejected ? "#6b7280" : "#2563eb" }}>
                    {isRepairRejected
                      ? "Rs. 0 (Rejected)"
                      : tracking.repairQuotation?.totalAmount
                      ? `Rs. ${Number(tracking.repairQuotation.totalAmount).toLocaleString()} ${isRepairPaid ? "✓ Paid" : "(Pending Completion)"}`
                      : "Pending Inspection"}
                  </span>
                </div>

                {isRepairCompleted && !isRepairPaid && !isRepairRejected && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1" }}>
                    <button
                      type="button"
                      className="gh-next-button"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => navigate("/get-help/summary")}
                    >
                      Proceed to Final Settlement
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>

              {/* Fees Summary Card */}
              <section className="gethelp-card" style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", fontSize: "14px", marginBottom: "12px", color: "#1e293b" }}>
                  <ReceiptText size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                  Billing &amp; Payment Summary
                </strong>

                {/* Inspection Fee line */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Inspection Fee:</span>
                  <span style={{ fontWeight: "bold", color: isInspectionPaid ? "#15803d" : "#b45309" }}>
                    Rs. {Number(tracking.inspectionFee?.totalAmount || 0).toLocaleString()}{" "}
                    {isInspectionPaid ? "✓ Paid" : "(Pending)"}
                  </span>
                </div>

                {/* Repair Fee line */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Repair Fee:</span>
                  <span style={{ fontWeight: "bold", color: isRepairPaid ? "#15803d" : isRepairRejected ? "#6b7280" : "#2563eb" }}>
                    {isRepairRejected
                      ? "Rs. 0 (Rejected)"
                      : tracking.repairQuotation?.totalAmount
                        ? `Rs. ${Number(tracking.repairQuotation.totalAmount).toLocaleString()} ${isRepairPaid ? "✓ Paid" : "(Pending Completion)"}`
                        : "Pending Inspection"}
                  </span>
                </div>

                {isRepairCompleted && !isRepairPaid && !isRepairRejected && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1" }}>
                    <button
                      type="button"
                      className="gh-next-button"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => navigate("/get-help/summary")}
                    >
                      Proceed to Final Settlement
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>

              {/* Safety card */}
              <section className="gethelp-card track-safety">
                <strong><ShieldAlert size={16} /> Roadside Safety Reminder</strong>
                <p>Stay behind the safety barrier if available. Keep hazard lights on while waiting.</p>
                <div className="track-safety-bottom">
                  <span>Emergency Police: <a href="tel:119">119</a></span>
                  <button type="button" onClick={handleCancel}>Cancel Request</button>
                </div>
              </section>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <div className="track-bottom-left">
              <button type="button" className="gh-back-button" onClick={() => navigate("/get-help/mechanic-found")}>
                <ArrowLeft size={16} />
                Back to Quotation Details
              </button>
              <span>
                Status: {currentStatus.replace(/_/g, " ").toUpperCase()} ({saved.issue || "Service request"})
              </span>
            </div>

            <div className="gh-bottom-right">
              <button
                type="button"
                className="gh-next-button"
                disabled={!isRepairCompleted && !isRepairRejected && !isRepairPaid}
                title={isRepairCompleted || isRepairRejected ? "Proceed to review settlement" : "Available when repair is completed"}
                onClick={() => navigate("/get-help/summary")}
              >
                {isRepairPaid ? "View Receipt & Summary" : isRepairCompleted ? "Proceed to Final Settlement" : isRepairRejected ? "View Concluded Summary" : "Waiting for Repair Completion"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {notice && (
        <div className="track-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

export default Tracking;
