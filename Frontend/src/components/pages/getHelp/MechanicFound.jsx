import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  BadgeCheck,
  Star,
  MapPin,
  Zap,
  Wrench,
  Timer,
  CircleCheck,
  Banknote,
  QrCode,
  CreditCard,
  Phone,
  X,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import {
  getAssignment,
  getNearbyMechanics,
  respondToQuotation,
  payInspectionFee,
} from "../../../api/getHelp";
import { getCreatedRequestId, readRequest } from "./requestSampleData";
import "../../styles/GetHelp.css";

function MechanicFound() {
  const navigate = useNavigate();
  const requestId = getCreatedRequestId();
  const requestDraft = readRequest();
  const [assignment, setAssignment] = useState(null);
  const [nearbyMechanics, setNearbyMechanics] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    const loadMechanicData = async () => {
      try {
        if (!requestId) {
          throw new Error("Your service request is missing. Please submit it again.");
        }

        const [nearbyData, assignmentData] = await Promise.all([
          getNearbyMechanics(requestId),
          getAssignment(requestId),
        ]);
        if (!active) return;

        // If already paid inspection fee or further in workflow, redirect to tracking
        if (
          assignmentData.inspectionPayment?.status === "paid" ||
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
          ].includes(assignmentData.status)
        ) {
          navigate("/get-help/tracking");
          return;
        }

        setNearbyMechanics(nearbyData.mechanics || []);
        setAssignment(assignmentData);
        setSecondsLeft(assignmentData.quotation?.quotationHoldSeconds || 300);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMechanicData();
    return () => {
      active = false;
    };
  }, [requestId, navigate]);

  useEffect(() => {
    if (!assignment || secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [assignment, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const mechanic = assignment?.mechanic;

  // Use real backend inspection fee or fallback to default breakdown
  const inspectionFee = assignment?.inspectionFee || {
    travelFee: 500,
    visitFee: 500,
    inspectionCharge: 1000,
    totalAmount: 2000,
    description: "Mechanic travelling, location visit, and vehicle inspection",
  };

  const handleQuotationResponse = async (response) => {
    try {
      setActionLoading(true);
      setError("");
      const result = await respondToQuotation(requestId, response, mechanic.id);
      if (response === "accepted") {
        setShowDemoModal(true);
      } else {
        setNearbyMechanics((mechanics) =>
          mechanics.filter((item) => item.id !== mechanic.id)
        );
        setAssignment((current) => ({
          ...current,
          mechanic: result.nextMechanic,
          noMechanicsAvailable: result.noMoreMechanics,
        }));
        if (result.nextMechanic) {
          setSecondsLeft(assignment?.quotation?.quotationHoldSeconds || 300);
        }
      }
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionLoading(false);
    }
  };

  // STEP 3: Customer executes demo payment for inspection fee
  const handleExecuteDemoPayment = async () => {
    try {
      setActionLoading(true);
      setError("");

      if (assignment.status === "pending" || assignment.status === "searching") {
        await respondToQuotation(requestId, "accepted", mechanic.id);
      }

      // Call backend to validate and record demo payment in MongoDB
      const result = await payInspectionFee(requestId, {
        paymentMethod: selectedPaymentMethod,
      });

      setDemoSuccess(result.message || "Inspection fee demo payment confirmed!");

      setTimeout(() => {
        navigate("/get-help/tracking");
      }, 1000);
    } catch (payError) {
      setError(payError.message || "Failed to process inspection fee demo payment.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !assignment) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading available mechanics and quotation...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (assignment.noMechanicsAvailable || !mechanic) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            <RequestStepper currentStep={4} />
            <section className="gethelp-card">
              <h2>No more mechanics available</h2>
              <p>All available mechanics have been rejected for this request.</p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          {/* Top strip */}
          <div className="summary-strip">
            <span className="summary-chip green">● Batticaloa East Dispatch</span>
            <span>{requestDraft.location?.address || "Breakdown location"}</span>
            <strong className="summary-step">
              <ShieldCheck size={13} /> {assignment.requestReference}
            </strong>
          </div>

          <RequestStepper currentStep={4} />

          {/* Green banner with the countdown */}
          <section className="found-banner">
            <span className="found-banner-icon">
              <LockKeyhole size={22} />
            </span>

            <div className="found-banner-text">
              <h2>
                Mechanic found <span className="accepted-badge">Inspection Fee</span>
              </h2>
              <p>{mechanic.name} is ready for dispatch upon inspection fee confirmation.</p>
            </div>

            <div className="found-timer">
              <small>Quotation Holds For</small>
              <strong>
                <Timer size={15} /> {minutes}:{seconds} min
              </strong>
            </div>
          </section>

          <div className="found-grid">
            {/* ===== Left column ===== */}
            <div className="found-left">
              <section className="gethelp-card">
                <div className="mechanic-top">
                  <div className="mechanic-photo">{mechanic.name?.charAt(0) || "M"}</div>

                  <div>
                    <h2>{mechanic.name}</h2>
                    <span className="verified-badge">
                      <BadgeCheck size={13} /> {mechanic.verified ? "RoadMate Verified Partner" : "RoadMate Partner"}
                    </span>

                    <p className="mechanic-rating">
                      <Star size={14} fill="#f5a524" color="#f5a524" />
                      <strong>{mechanic.rating || 4.8}</strong> ({mechanic.ratingCount || 12} roadside reviews)
                    </p>

                    <p className="mechanic-address">
                      <MapPin size={13} /> {mechanic.location || "Batticaloa"}
                    </p>

                    <div className="mechanic-badges">
                      <span className="distance-badge">
                        ● {mechanic.distanceKm === null ? "Distance unavailable" : `${mechanic.distanceKm} km away`}
                      </span>
                      <span className="eta-badge">
                        <Zap size={13} /> ETA ~15 mins
                      </span>
                    </div>

                    <p className="mechanic-address">
                      Specialty: {mechanic.specialty || "Auto Technician"}
                    </p>
                  </div>
                </div>

                <h4 className="specialty-title">MECHANIC SPECIALTIES &amp; EQUIPMENT</h4>
                <div className="specialty-grid">
                  {["Engine Diagnostics", "Tire & Battery Service", "Roadside Recovery", "Mobile Toolkit"].map((item) => (
                    <div key={item} className="specialty-item">
                      <Wrench size={15} />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="trust-list">
                  <span><CircleCheck size={14} /> Phone Verified</span>
                  <span><CircleCheck size={14} /> Police Cleared</span>
                  <span><CircleCheck size={14} /> 5+ Years Local Experience</span>
                </div>
              </section>

              <section className="gethelp-card">
                <h4 className="specialty-title">AVAILABLE MECHANICS NEARBY</h4>
                <div className="specialty-grid">
                  {nearbyMechanics.map((item) => (
                    <div className="specialty-item" key={item.id}>
                      <Wrench size={15} />
                      <span>
                        <strong>{item.name}</strong> · {item.rating || 4.8}★ · {item.location} · {item.distanceKm} km
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ===== Right column: STEP 2 & 3 Inspection Fee ===== */}
            <div className="found-right">
              <section className="gethelp-card quotation-card">
                <div className="quotation-top">
                  <span className="quotation-label">INSPECTION FEE</span>
                  <span className="guaranteed-badge">Pre-Dispatch</span>
                </div>

                <h2>Inspection Fee Breakdown</h2>
                <p className="gh-help-text">
                  Covers mechanic travel and on-site diagnosis. Repair charges for labour and parts will be quoted separately after inspection.
                </p>

                <div className="quotation-box">
                  <div className="quotation-line">
                    <div>
                      <strong>Mechanic Travelling Charge</strong>
                      <p>Fuel &amp; distance coverage to breakdown area</p>
                    </div>
                    <strong>Rs. {Number(inspectionFee.travelFee || 0).toLocaleString()}</strong>
                  </div>

                  <div className="quotation-line">
                    <div>
                      <strong>Breakdown Location Visit</strong>
                      <p>Emergency roadside dispatch fee</p>
                    </div>
                    <strong>Rs. {Number(inspectionFee.visitFee || 0).toLocaleString()}</strong>
                  </div>

                  <div className="quotation-line">
                    <div>
                      <strong>Vehicle Inspection Charge</strong>
                      <p>On-site diagnostic inspection &amp; tool usage</p>
                    </div>
                    <strong>Rs. {Number(inspectionFee.inspectionCharge || 0).toLocaleString()}</strong>
                  </div>

                  <div className="quotation-total">
                    <div>
                      <small>TOTAL INSPECTION FEE</small>
                      <span>Pre-payment required to dispatch mechanic</span>
                    </div>
                    <strong>Rs. {Number(inspectionFee.totalAmount || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="guarantee-note" style={{ background: "#eef4ff", border: "1px solid #c9daff", padding: "12px", borderRadius: "10px", marginTop: "14px" }}>
                  <CircleCheck size={16} color="#1453ff" />
                  <p style={{ margin: 0, fontSize: "12px", color: "#223567" }}>
                    <strong>Notice:</strong> This inspection fee confirms the mechanic dispatch. The mechanic will NOT travel until this fee is paid.
                  </p>
                </div>

                <p className="settlement-title" style={{ marginTop: "14px" }}>Choose Demo Payment Method:</p>
                <div className="settlement-chips">
                  <span
                    onClick={() => setSelectedPaymentMethod("card")}
                    style={{
                      cursor: "pointer",
                      border: selectedPaymentMethod === "card" ? "2px solid #1453ff" : "1px solid #dfe3ee",
                      background: selectedPaymentMethod === "card" ? "#eef2ff" : "#fff",
                      fontWeight: selectedPaymentMethod === "card" ? "bold" : "normal"
                    }}
                  >
                    <CreditCard size={14} /> Card (Demo)
                  </span>
                  <span
                    onClick={() => setSelectedPaymentMethod("qr")}
                    style={{
                      cursor: "pointer",
                      border: selectedPaymentMethod === "qr" ? "2px solid #1453ff" : "1px solid #dfe3ee",
                      background: selectedPaymentMethod === "qr" ? "#eef2ff" : "#fff",
                      fontWeight: selectedPaymentMethod === "qr" ? "bold" : "normal"
                    }}
                  >
                    <QrCode size={14} /> LankaQR (Demo)
                  </span>
                  <span
                    onClick={() => setSelectedPaymentMethod("cash")}
                    style={{
                      cursor: "pointer",
                      border: selectedPaymentMethod === "cash" ? "2px solid #1453ff" : "1px solid #dfe3ee",
                      background: selectedPaymentMethod === "cash" ? "#eef2ff" : "#fff",
                      fontWeight: selectedPaymentMethod === "cash" ? "bold" : "normal"
                    }}
                  >
                    <Banknote size={14} /> Cash Guarantee
                  </span>
                </div>

                {/* Demo Payment simulation button */}
                <div style={{ marginTop: "18px" }}>
                  <button
                    type="button"
                    className="gh-next-button"
                    style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px" }}
                    onClick={() => setShowDemoModal(true)}
                    disabled={actionLoading || !mechanic}
                  >
                    Pay Inspection Fee (Demo Simulation) - Rs. {Number(inspectionFee.totalAmount || 0).toLocaleString()}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <div className="sos-box">
              <Phone size={16} />
              <div>
                <span>Need urgent SOS help or police assistance?</span>
                <strong>Call Batticaloa Hotline: 065-222-3333</strong>
              </div>
            </div>

            <div className="gh-bottom-right">
              {error && <p className="form-error" role="alert">{error}</p>}
              <button
                type="button"
                className="gh-back-button"
                onClick={() => handleQuotationResponse("rejected")}
                disabled={actionLoading || !mechanic}
              >
                <X size={16} />
                Reject Mechanic &amp; Find Next
              </button>

              <button
                type="button"
                className="gh-next-button"
                onClick={() => setShowDemoModal(true)}
                disabled={actionLoading || !mechanic}
              >
                {actionLoading ? "Processing..." : "Pay Inspection Fee"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* STEP 3: Demo Payment Confirmation Modal */}
      {showDemoModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(10, 20, 40, 0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "#e8efff",
                color: "#1453ff",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <CreditCard size={28} />
            </div>

            <h3 style={{ fontSize: "20px", margin: "0 0 8px", color: "#14203b" }}>
              DEMO PAYMENT SIMULATION
            </h3>

            <p style={{ fontSize: "13px", color: "#66728a", margin: "0 0 18px", lineHeight: "1.5" }}>
              This is a <strong>DEMO payment simulation</strong> for testing RoadMate. <strong>No real money will be transferred</strong> or charged to your account.
            </p>

            <div
              style={{
                background: "#f7f8fd",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "20px",
                border: "1px solid #e2e6f4",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#66728a" }}>Purpose:</span>
                <strong>Vehicle Inspection &amp; Travel Fee</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#66728a" }}>Mechanic:</span>
                <strong>{mechanic.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#66728a" }}>Payment Method:</span>
                <strong style={{ textTransform: "capitalize" }}>Demo {selectedPaymentMethod}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "15px" }}>
                <span style={{ fontWeight: "bold" }}>Total Demo Amount:</span>
                <strong style={{ color: "#1453ff" }}>Rs. {Number(inspectionFee.totalAmount || 0).toLocaleString()}</strong>
              </div>
            </div>

            {demoSuccess && (
              <div style={{ background: "#ecfdf5", color: "#065f46", padding: "10px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                ✓ {demoSuccess}
              </div>
            )}

            {error && (
              <p className="form-error" role="alert" style={{ marginBottom: "16px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="gh-back-button"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setShowDemoModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gh-next-button"
                style={{ flex: 2, justifyContent: "center" }}
                onClick={handleExecuteDemoPayment}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm Demo Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MechanicFound;
