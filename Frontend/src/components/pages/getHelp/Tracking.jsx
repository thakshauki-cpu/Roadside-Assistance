import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navigation,
  Gauge,
  TrafficCone,
  LocateFixed,
  Plus,
  Minus,
  Layers,
  Truck,
  Wrench,
  MapPin,
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
  CarFront,
  CreditCard,
  AlertTriangle,
  ReceiptText,
  X,
} from "lucide-react";

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
  formatRs,
  getCreatedRequestId,
  readRequest,
} from "./requestSampleData";
import "../../styles/GetHelp.css";
import "../../styles/Tracking.css";

const mapFiles = import.meta.glob("../../../assets/tracking-map.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mechanicFiles = import.meta.glob("../../../assets/mechanic-siva.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mapImage = Object.values(mapFiles)[0];
const mechanicImage = Object.values(mechanicFiles)[0];

const SECONDS_PER_MINUTE = 2;

function Tracking() {
  const navigate = useNavigate();
  const requestId = getCreatedRequestId();
  const saved = readRequest();
  const plate = saved.vehicle?.registrationNumber || "Vehicle";
  const [elapsed, setElapsed] = useState(0);
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
    loadTrackingData(true);

    // Periodic API polling every 3 seconds for live status updates
    const pollInterval = setInterval(() => {
      loadTrackingData(false);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadTrackingData]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((previous) => previous + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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

  if (loading || !tracking || !assignment) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading mechanic tracking...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const mechanic = tracking.mechanic;
  const currentStatus = tracking.status;

  // Status mapping for the 10 required workflow steps:
  // 1. Inspection Payment Confirmed
  // 2. Mechanic Notified
  // 3. Mechanic On the Way
  // 4. Mechanic Arrived
  // 5. Vehicle Inspection
  // 6. Repair Quotation Submitted
  // 7. Repair Accepted / Rejected
  // 8. Repair In Progress
  // 9. Repair Completed
  // 10. Repair Payment Completed

  const isInspectionPaid =
    tracking.inspectionPayment?.status === "paid" ||
    [
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

  const isMechanicNotified = isInspectionPaid;
  const isOnTheWay = ["on_the_way", "arrived", "inspecting", "inspection_completed", "quotation_submitted", "repair_in_progress", "repair_rejected", "repair_completed", "completed"].includes(currentStatus);
  const isArrived = ["arrived", "inspecting", "inspection_completed", "quotation_submitted", "repair_in_progress", "repair_rejected", "repair_completed", "completed"].includes(currentStatus);
  const isInspectionCompleted = ["inspection_completed", "quotation_submitted", "repair_in_progress", "repair_rejected", "repair_completed", "completed"].includes(currentStatus);
  const isQuotationSubmitted = ["quotation_submitted", "repair_in_progress", "repair_rejected", "repair_completed", "completed"].includes(currentStatus);
  const isRepairAccepted = ["repair_in_progress", "repair_completed", "completed"].includes(currentStatus);
  const isRepairRejected = currentStatus === "repair_rejected";
  const isRepairCompleted = ["repair_completed", "completed"].includes(currentStatus);
  const isRepairPaid = tracking.repairPayment?.status === "paid" || currentStatus === "completed";

  // Build the 10 Milestones sequence
  const milestones = [
    {
      label: "Inspection Paid",
      sub: isInspectionPaid
        ? `Confirmed ${tracking.inspectionPayment?.paidAt ? new Date(tracking.inspectionPayment.paidAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`
        : "Pending Demo Payment",
      icon: Check,
      status: isInspectionPaid ? "done" : currentStatus === "inspection_fee_submitted" ? "active" : "pending",
    },
    {
      label: "Mechanic Notified",
      sub: isMechanicNotified
        ? "Mechanic Alerted"
        : "Awaiting Payment",
      icon: Check,
      status: isMechanicNotified ? (currentStatus === "inspection_paid" ? "active" : "done") : "pending",
    },
    {
      label: "Mechanic On The Way",
      sub: isOnTheWay
        ? (isArrived ? "Dispatched" : "In Transit")
        : "Preparing to Travel",
      icon: Truck,
      status: currentStatus === "on_the_way" ? "active" : isOnTheWay ? "done" : "pending",
    },
    {
      label: "Mechanic Arrived",
      sub: isArrived
        ? (tracking.arrivedAt ? `At ${new Date(tracking.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "On Site")
        : "Estimated: " + (tracking.etaMinutes || 15) + "m",
      icon: MapPin,
      status: currentStatus === "arrived" ? "active" : isArrived ? "done" : "pending",
    },
    {
      label: "Vehicle Inspection",
      sub: isInspectionCompleted
        ? "Inspection Complete"
        : currentStatus === "inspecting"
        ? "Diagnosing Vehicle"
        : "Pending Arrival",
      icon: Wrench,
      status: currentStatus === "inspecting" ? "active" : isInspectionCompleted ? "done" : "pending",
    },
    {
      label: "Repair Quotation",
      sub: isQuotationSubmitted
        ? `Quoted Rs. ${Number(tracking.repairQuotation?.totalAmount || 0).toLocaleString()}`
        : "Awaiting Inspection",
      icon: ReceiptText,
      status: currentStatus === "inspection_completed" ? "active" : isQuotationSubmitted ? "done" : "pending",
    },
    {
      label: "Customer Decision",
      sub: isRepairRejected
        ? "Quotation Rejected"
        : isRepairAccepted
        ? "Quotation Accepted"
        : currentStatus === "quotation_submitted"
        ? "Review Required"
        : "Pending Quote",
      icon: Check,
      status: currentStatus === "quotation_submitted" ? "active" : (isRepairAccepted || isRepairRejected) ? "done" : "pending",
    },
    {
      label: "Repair In Progress",
      sub: isRepairRejected
        ? "Cancelled"
        : isRepairCompleted
        ? "Repair Finished"
        : isRepairAccepted
        ? "Active Repairs"
        : "Pending Approval",
      icon: Wrench,
      status: currentStatus === "repair_in_progress" ? "active" : isRepairCompleted ? "done" : "pending",
    },
    {
      label: "Repair Completed",
      sub: isRepairCompleted
        ? (tracking.repairCompletedAt ? `Done ${new Date(tracking.repairCompletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Completed")
        : isRepairRejected
        ? "Not Applicable"
        : "In Progress",
      icon: Check,
      status: currentStatus === "repair_completed" ? "active" : isRepairCompleted ? "done" : "pending",
    },
    {
      label: "Repair Settled",
      sub: isRepairPaid
        ? "Settled (Demo)"
        : isRepairRejected
        ? "No Fee Charged"
        : isRepairCompleted
        ? "Payment Due"
        : "Pending Repair",
      icon: CreditCard,
      status: isRepairPaid ? "done" : (currentStatus === "repair_completed" ? "active" : "pending"),
    },
  ];

  const arrived = isArrived;
  const etaMinutes = arrived ? 0 : Math.max(0, tracking.etaMinutes - Math.floor(elapsed / SECONDS_PER_MINUTE));
  const progress = arrived ? 1 : Math.min(1, Math.max(0, 1 - etaMinutes / (tracking.etaMinutes || 15)));
  const kmLeft = (tracking.distanceRemainingKm || 4.2) * (1 - progress);
  const refreshedAgo = elapsed % 4;

  const vanX = tracking.vanPosition
    ? tracking.vanPosition.x + (tracking.breakdownPosition.x - tracking.vanPosition.x) * progress
    : 30;
  const vanY = tracking.vanPosition
    ? tracking.vanPosition.y + (tracking.breakdownPosition.y - tracking.vanPosition.y) * progress
    : 45;

  const getStatusHeadline = () => {
    switch (currentStatus) {
      case "inspection_fee_submitted":
        return "Inspection Fee Ready – Please Confirm Payment";
      case "inspection_paid":
        return "Inspection Fee Confirmed – Mechanic Notified";
      case "on_the_way":
        return "Mechanic is on the way to your location";
      case "arrived":
        return "Mechanic has arrived at your location";
      case "inspecting":
        return "Mechanic is inspecting your vehicle";
      case "inspection_completed":
        return "Vehicle inspection completed – Preparing quotation";
      case "quotation_submitted":
        return "Repair Quotation Submitted – Your Decision Required";
      case "repair_in_progress":
        return "Repair in progress by mechanic";
      case "repair_rejected":
        return "Repair Quotation Rejected – Service Concluded";
      case "repair_completed":
        return "Repair Completed – Final Payment Ready";
      case "completed":
        return "Service & Repair Completed – Settled";
      default:
        return "Roadside Assistance Request Active";
    }
  };

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          <RequestStepper currentStep={5} />

          {/* Heading card */}
          <section className="track-header">
            <div>
              <div className="track-meta">
                <span>Request #{tracking.requestReference}</span>
                <span>•</span>
                <span>{tracking.breakdownLocation?.address || "Breakdown Location"}</span>
                <span>•</span>
                <span className="track-live-text">Live Status</span>
              </div>
              <h1>{getStatusHeadline()}</h1>
            </div>

            <span className="track-gps-pill">
              <span className="track-gps-dot" />
              Live Status • Polling backend ({refreshedAgo}s ago)
            </span>
          </section>

          {/* STEP 3 PROMPT: If inspection fee needs payment */}
          {currentStatus === "inspection_fee_submitted" && !isInspectionPaid && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <AlertTriangle color="#d97706" size={20} />
                <strong style={{ color: "#b45309", fontSize: "16px" }}>Inspection Fee Payment Required</strong>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#78350f" }}>
                The mechanic has submitted an inspection fee of <strong>Rs. {Number(tracking.inspectionFee?.totalAmount || 2000).toLocaleString()}</strong>.
                The mechanic cannot travel until this fee is confirmed.
              </p>
              <button
                type="button"
                className="gh-next-button"
                onClick={handlePayInspectionDemo}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing Demo Payment..." : `Pay Inspection Fee (Demo) - Rs. ${Number(tracking.inspectionFee?.totalAmount || 2000).toLocaleString()}`}
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
            {/* ===== Left column: map and 10-step milestones ===== */}
            <div className="track-left">
              <div className="track-map">
                {mapImage ? (
                  <img className="track-map-image" src={mapImage} alt="Map of Batticaloa" />
                ) : (
                  <p className="track-missing">
                    Roadside dispatch map area
                  </p>
                )}

                {/* Dashed route line */}
                <svg className="track-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <line
                    x1={tracking.roadPath?.start?.x || 20}
                    y1={tracking.roadPath?.start?.y || 80}
                    x2={tracking.roadPath?.end?.x || 80}
                    y2={tracking.roadPath?.end?.y || 20}
                    className="track-route-road"
                  />
                  <line
                    x1={vanX}
                    y1={vanY}
                    x2={tracking.breakdownPosition?.x || 75}
                    y2={tracking.breakdownPosition?.y || 30}
                    className="track-route-line"
                  />
                </svg>

                {/* Top floating info box */}
                <div className="track-floater">
                  <span className="track-floater-road">
                    <Navigation size={15} /> {tracking.routeDescription || "Batticaloa Roadway"}
                  </span>
                  <span className="track-divider" />
                  <span>
                    <Gauge size={14} /> Status: <b>{arrived ? "Arrived" : currentStatus.replace(/_/g, " ")}</b>
                  </span>
                  <span className="track-divider" />
                  <span>
                    <TrafficCone size={14} /> Traffic: <b className="track-green">{tracking.traffic || "Normal"}</b>
                  </span>
                </div>

                <div className="track-controls">
                  <button type="button" aria-label="My location"><LocateFixed size={18} /></button>
                  <button type="button" aria-label="Zoom in"><Plus size={16} /></button>
                  <button type="button" aria-label="Zoom out"><Minus size={16} /></button>
                  <button type="button" aria-label="Map layers"><Layers size={16} /></button>
                </div>

                {/* Mechanic Pin */}
                <div className="track-pin track-pin-van" style={{ left: vanX + "%", top: vanY + "%" }}>
                  <span className="track-pin-label track-pin-label-blue">
                    <Truck size={13} /> {mechanic.name} ({mechanic.plate || "Service Van"})
                  </span>
                  <span className="track-pin-circle track-pin-circle-blue">
                    <Wrench size={15} />
                  </span>
                </div>

                {/* Breakdown Pin */}
                <div
                  className="track-pin track-pin-user"
                  style={{
                    left: (tracking.breakdownPosition?.x || 75) + "%",
                    top: (tracking.breakdownPosition?.y || 30) + "%",
                  }}
                >
                  <span className="track-pin-label track-pin-label-dark">
                    <span className="track-red-dot" /> Your Breakdown ({plate})
                  </span>
                  <span className="track-pin-circle track-pin-circle-red">
                    <MapPin size={15} />
                  </span>
                </div>

                <div className="track-banner">
                  <span>
                    <Navigation size={13} /> {tracking.routeDescription || "En route"}
                  </span>
                  <strong>{arrived ? "Mechanic on site" : kmLeft.toFixed(1) + " km remaining"}</strong>
                </div>
              </div>

              {/* STEP 6: 10 Milestones sequence */}
              <section className="gethelp-card track-milestones">
                <div className="track-milestones-top">
                  <strong>Service &amp; Repair Workflow Progress</strong>
                  <span>Status: {currentStatus.replace(/_/g, " ").toUpperCase()}</span>
                </div>

                <div className="track-steps" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                  {milestones.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className={"track-step " + item.status}>
                        <span className="track-step-circle">
                          {item.status === "done" ? <Check size={14} /> : <Icon size={14} />}
                        </span>
                        <strong>{index + 1}. {item.label}</strong>
                        <small>{item.sub}</small>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ===== Right column ===== */}
            <div className="track-right">
              {/* ETA card */}
              <section className="track-eta">
                <div>
                  <span className="track-eta-label">DISPATCH STATUS</span>
                  <p className="track-eta-time">
                    {arrived ? (
                      <b>On Site</b>
                    ) : (
                      <>
                        <b>{etaMinutes}</b> <span>mins ETA</span>
                      </>
                    )}
                  </p>
                  <small>
                    Breakdown spot: {tracking.breakdownLocation?.landmark || tracking.breakdownLocation?.address || "Selected location"}
                  </small>
                </div>
                <span className="track-eta-icon">
                  <Timer size={26} />
                </span>
              </section>

              {/* Mechanic card */}
              <section className="gethelp-card track-mechanic">
                <div className="track-mechanic-top">
                  <div className="track-photo-wrap">
                    {mechanicImage ? (
                      <img className="track-photo" src={mechanicImage} alt={mechanic.name} />
                    ) : (
                      <span className="track-photo track-photo-missing">
                        {mechanic.name?.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="track-photo-badge">
                      <BadgeCheck size={13} />
                    </span>
                  </div>

                  <div>
                    <h2>{mechanic.name}</h2>
                    <p>{mechanic.owner || mechanic.name} • {mechanic.role || "Roadside Mechanic"}</p>
                    <span className="track-rating">
                      <Star size={13} fill="currentColor" /> <b>{mechanic.rating || 4.9}</b>
                      <small>• {mechanic.rescues || 18} rescues</small>
                    </span>
                  </div>
                </div>

                <div className="track-facts">
                  <div>
                    <span><CarFront size={13} /> Unit</span>
                    <strong>{mechanic.unit || "Roadside Unit"}</strong>
                  </div>
                  <div>
                    <span><BadgeCheck size={13} /> Registration</span>
                    <strong className="track-mono">{mechanic.plate || "WP-CAB-4821"}</strong>
                  </div>
                  <div>
                    <span><Wrench size={13} /> Equipment</span>
                    <strong>{mechanic.equipment || "OBD2, Jack, Kit"}</strong>
                  </div>
                </div>

                <div className="track-contact">
                  {mechanic.phone && (
                    <a href={"tel:" + mechanic.phone.replace(/[^\d+]/g, "")} className="track-call">
                      <Phone size={15} /> Call {mechanic.name}
                    </a>
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
              {/* Enabled when repair is completed or rejected to view summary */}
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
