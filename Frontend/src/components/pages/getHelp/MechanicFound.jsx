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
import RequestStepper from "../../getHelp/RequestStepper";
import {
  getAssignment,
  getNearbyMechanics,
  respondToQuotation,
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

        setNearbyMechanics(nearbyData.mechanics);
        setAssignment(assignmentData);
        setSecondsLeft(assignmentData.quotation.quotationHoldSeconds);
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
  }, [requestId]);

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
  const quotation = assignment?.quotation;

  const handleQuotationResponse = async (response) => {
    try {
      setActionLoading(true);
      setError("");
      const result = await respondToQuotation(requestId, response, mechanic.id);
      if (response === "accepted") {
        navigate("/get-help/tracking");
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
          setSecondsLeft(quotation.quotationHoldSeconds);
        }
      }
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !assignment || !quotation) {
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
                Mechanic found <span className="accepted-badge">Quotation</span>
              </h2>
              <p>{mechanic.name} is available to assist with this request.</p>
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
                  {/* Photo placeholder: the first letter of the name */}
                  <div className="mechanic-photo">{mechanic.name.charAt(0)}</div>

                  <div>
                    <h2>{mechanic.name}</h2>
                    <span className="verified-badge">
                      <BadgeCheck size={13} /> {mechanic.verified ? "RoadMate Verified Partner" : "RoadMate Partner"}
                    </span>

                    <p className="mechanic-rating">
                      <Star size={14} fill="#f5a524" color="#f5a524" />
                      <strong>{mechanic.rating}</strong> ({mechanic.reviews} roadside reviews)
                    </p>

                    <p className="mechanic-address">
                      <MapPin size={13} /> {mechanic.address}
                    </p>

                    <div className="mechanic-badges">
                      <span className="distance-badge">● {mechanic.distanceKm} km away</span>
                      <span className="eta-badge">
                        <Zap size={13} /> ETA ~{mechanic.etaMinutes} mins
                      </span>
                    </div>
                    <p className="mechanic-address">
                      Vehicle: {mechanic.unit} · {mechanic.plate}
                    </p>
                  </div>
                </div>

                <h4 className="specialty-title">MECHANIC SPECIALTIES &amp; EQUIPMENT</h4>
                <div className="specialty-grid">
                  {mechanic.specialties.map((item) => (
                    <div key={item} className="specialty-item">
                      <Wrench size={15} />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="trust-list">
                  {mechanic.phoneVerified && <span><CircleCheck size={14} /> Phone Verified</span>}
                  {mechanic.policeCleared && <span><CircleCheck size={14} /> Police Cleared</span>}
                  <span><CircleCheck size={14} /> {mechanic.experienceYears} Years Local Experience</span>
                </div>
              </section>

              <section className="gethelp-card">
                <h4 className="specialty-title">AVAILABLE MOCK MECHANICS</h4>
                <div className="specialty-grid">
                  {nearbyMechanics.map((item) => (
                    <div className="specialty-item" key={item.id}>
                      <Wrench size={15} />
                      <span>
                        <strong>{item.name}</strong> · {item.available ? "Available" : "Unavailable"} ·
                        {" "}{item.rating} ({item.reviews} reviews) · {item.address} ·
                        {" "}{item.distanceKm} km · ETA {item.etaMinutes} mins · {item.unit}
                        {" "}{item.plate} · {item.specialties.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* ===== Right column: quotation ===== */}
            <div className="found-right">
              <section className="gethelp-card quotation-card">
                <div className="quotation-top">
                  <span className="quotation-label">OFFICIAL ESTIMATE</span>
                  <span className="guaranteed-badge">Guaranteed</span>
                </div>

                <h2>Upfront Service Quotation</h2>
                <p className="gh-help-text">
                  Guaranteed price with zero surprise charges. All prices in Sri Lankan Rupees (Rs.
                  / LKR).
                </p>

                <div className="quotation-box">
                  <div className="quotation-line">
                    <div>
                      <strong>Labour Charge</strong>
                      <p>{quotation.labourDescription}</p>
                    </div>
                    <strong>Rs. {quotation.labour.toLocaleString()}</strong>
                  </div>

                  <div className="quotation-line">
                    <div>
                      <strong>Parts &amp; Consumables</strong>
                      <p>{quotation.partsDescription}</p>
                    </div>
                    <strong>Rs. {quotation.parts.toLocaleString()}</strong>
                  </div>
                  {quotation.additionalCharges > 0 && (
                    <div className="quotation-line">
                      <strong>Additional Charges</strong>
                      <strong>Rs. {quotation.additionalCharges.toLocaleString()}</strong>
                    </div>
                  )}

                  <div className="quotation-total">
                    <div>
                      <small>TOTAL ESTIMATED AMOUNT</small>
                      <span>{quotation.estimatedServiceMinutes} mins estimated service time</span>
                    </div>
                    <strong>Rs. {quotation.total.toLocaleString()}</strong>
                  </div>
                </div>

                {/* <div className="guarantee-note">
                  <CircleCheck size={16} />
                  <p>
                    <strong>RoadMate Fixed-Price Guarantee:</strong> The mechanic cannot alter this
                    quotation on site without your explicit verbal and in-app consent.
                  </p>
                </div> */}

                <p className="settlement-title">Accepted Settlement Upon Work Completion:</p>
                <div className="settlement-chips">
                  <span>
                    <Banknote size={14} /> Cash (LKR)
                  </span>
                  <span>
                    <QrCode size={14} /> LankaQR Instant
                  </span>
                  <span>
                    <CreditCard size={14} /> Commercial / BOC Card
                  </span>
                </div>

                <p className="pay-note">
                  Pay nothing now. Payment is strictly executed after testing and your full
                  sign-off.
                </p>
              </section>

            </div>
          </div>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <div className="sos-box">
              <Phone size={16} />
              <div>
                <span>Need urgent SOS help or police assistance?</span>
                <a href="tel:0652223333">
                  Call Batticaloa Hotline: 065-222-3333
                </a>
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
                onClick={() => handleQuotationResponse("accepted")}
                disabled={actionLoading || !mechanic}
              >
                {actionLoading ? "Saving..." : "Accept Mechanic & Track"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MechanicFound;