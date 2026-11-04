import { useState, useEffect } from "react";
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
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import { getAssignment, getTracking } from "../../../api/getHelp";
import {
  formatRs,
  getCreatedRequestId,
  readRequest,
} from "./requestSampleData";
import "../../styles/GetHelp.css";
import "../../styles/Tracking.css";

// ----- Optional pictures (see the notes about src/assets) -----
// import.meta.glob finds the file if it exists. If it does not exist the page
// still works and shows a simple placeholder instead of breaking the build.
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

  useEffect(() => {
    let active = true;
    const loadTracking = async () => {
      try {
        if (!requestId) {
          throw new Error("Your service request is missing. Please submit it again.");
        }
        const [trackingData, assignmentData] = await Promise.all([
          getTracking(requestId),
          getAssignment(requestId),
        ]);
        if (!active) return;
        setTracking(trackingData);
        setAssignment(assignmentData);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTracking();
    return () => {
      active = false;
    };
  }, [requestId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((previous) => previous + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
  const etaMinutes = Math.max(
    0,
    tracking.etaMinutes - Math.floor(elapsed / SECONDS_PER_MINUTE)
  );
  const arrived = etaMinutes === 0;
  const progress =
    tracking.etaMinutes === 0
      ? 1
      : 1 - etaMinutes / tracking.etaMinutes;
  const kmLeft = tracking.distanceRemainingKm * (1 - progress);
  const refreshedAgo = elapsed % 5;
  const vanX =
    tracking.vanPosition.x +
    (tracking.breakdownPosition.x - tracking.vanPosition.x) * progress;
  const vanY =
    tracking.vanPosition.y +
    (tracking.breakdownPosition.y - tracking.vanPosition.y) * progress;
  const dispatchedAt = new Date(tracking.dispatchedAt).toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  );
  const expectedAt = new Date(tracking.expectedArrivalAt).toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  );

  // The 4 milestones. status: "done", "active" or "pending"
  const stage = arrived ? 3 : 2;
  const milestones = [
    { label: "Dispatched", sub: dispatchedAt, icon: Check, stageNumber: 1 },
    { label: "On The Way", sub: arrived ? "Completed" : "In Transit", icon: Truck, stageNumber: 2 },
    { label: "Arrived", sub: arrived ? "Just now" : "Est. " + expectedAt, icon: MapPin, stageNumber: 3 },
    { label: "Repair Active", sub: "Pending", icon: Wrench, stageNumber: 4 },
  ].map((item) => ({
    ...item,
    status: item.stageNumber < stage ? "done" : item.stageNumber === stage ? "active" : "pending",
  }));

  // Show a small message for 3 seconds
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
                <span>{tracking.startingLocation}</span>
                <span>•</span>
                <span className="track-live-text">Mock Tracking</span>
              </div>
              <h1>{arrived ? "Mechanic has arrived" : "Mechanic is on the way"}</h1>
            </div>

            <span className="track-gps-pill">
              <span className="track-gps-dot" />
              Mock dispatch • Updated {refreshedAgo}s ago
            </span>
          </section>

          <div className="track-grid">
            {/* ===== Left column: map and milestones ===== */}
            <div className="track-left">
              <div className="track-map">
                {mapImage ? (
                  <img className="track-map-image" src={mapImage} alt="Map of Batticaloa" />
                ) : (
                  <p className="track-missing">
                    Map picture not added yet. Export the Figma image inside "Background+Shadow"
                    (node 10:1481) and save it as <strong>src/assets/tracking-map.png</strong>
                  </p>
                )}

                {/* Dashed blue route from the van to the breakdown spot */}
                <svg className="track-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <line
                    x1={tracking.roadPath.start.x}
                    y1={tracking.roadPath.start.y}
                    x2={tracking.roadPath.end.x}
                    y2={tracking.roadPath.end.y}
                    className="track-route-road"
                  />
                  <line x1={vanX} y1={vanY} x2={tracking.breakdownPosition.x} y2={tracking.breakdownPosition.y} className="track-route-line" />
                </svg>

                {/* Top floating box */}
                <div className="track-floater">
                  <span className="track-floater-road">
                    <Navigation size={15} /> {tracking.routeDescription}
                  </span>
                  <span className="track-divider" />
                  <span>
                    <Gauge size={14} /> Speed: <b>{arrived ? 0 : tracking.speedKmh} km/h</b>
                  </span>
                  <span className="track-divider" />
                  <span>
                    <TrafficCone size={14} /> Traffic: <b className="track-green">{tracking.traffic}</b>
                  </span>
                </div>

                {/* Map buttons (only for show for now) */}
                <div className="track-controls">
                  <button type="button" aria-label="My location">
                    <LocateFixed size={18} />
                  </button>
                  <button type="button" aria-label="Zoom in">
                    <Plus size={16} />
                  </button>
                  <button type="button" aria-label="Zoom out">
                    <Minus size={16} />
                  </button>
                  <button type="button" aria-label="Map layers">
                    <Layers size={16} />
                  </button>
                </div>

                {/* Mechanic pin. Its position is set from the live values above. */}
                <div className="track-pin track-pin-van" style={{ left: vanX + "%", top: vanY + "%" }}>
                  <span className="track-pin-label track-pin-label-blue">
                    <Truck size={13} /> {mechanic.name} ({mechanic.plate})
                  </span>
                  <span className="track-pin-circle track-pin-circle-blue">
                    <Wrench size={15} />
                  </span>
                </div>

                {/* Customer breakdown pin */}
                <div className="track-pin track-pin-user" style={{ left: tracking.breakdownPosition.x + "%", top: tracking.breakdownPosition.y + "%" }}>
                  <span className="track-pin-label track-pin-label-dark">
                    <span className="track-red-dot" /> Your Breakdown ({plate})
                  </span>
                  <span className="track-pin-circle track-pin-circle-red">
                    <MapPin size={15} />
                  </span>
                </div>

                {/* Bottom banner */}
                <div className="track-banner">
                  <span>
                    <Navigation size={13} /> {tracking.routeDescription}
                  </span>
                  <strong>{arrived ? "Arrived" : kmLeft.toFixed(1) + " km remaining"}</strong>
                </div>
              </div>

              {/* Milestones */}
              <section className="gethelp-card track-milestones">
                <div className="track-milestones-top">
                  <strong>Dispatch Milestone Progress</strong>
                  <span>Stage {stage} of 4</span>
                </div>

                <div className="track-steps">
                  {milestones.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className={"track-step " + item.status}>
                        <span className="track-step-circle">
                          {item.status === "done" ? <Check size={14} /> : <Icon size={14} />}
                        </span>
                        <strong>{item.label}</strong>
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
                  <span className="track-eta-label">ESTIMATED ARRIVAL</span>
                  <p className="track-eta-time">
                    {arrived ? (
                      <b>Now</b>
                    ) : (
                      <>
                        <b>{etaMinutes}</b> <span>mins</span>
                      </>
                    )}
                  </p>
                  <small>
                    Expected at {tracking.breakdownLocation.landmark ||
                      tracking.breakdownLocation.address}: {expectedAt}
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
                        {mechanic.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="track-photo-badge">
                      <BadgeCheck size={13} />
                    </span>
                  </div>

                  <div>
                    <h2>{mechanic.name}</h2>
                    <p>
                      {mechanic.owner} • {mechanic.role}
                    </p>
                    <span className="track-rating">
                      <Star size={13} fill="currentColor" /> <b>{mechanic.rating}</b>
                      <small>
                        • {mechanic.rescues} rescues in Batticaloa
                      </small>
                    </span>
                  </div>
                </div>

                <div className="track-facts">
                  <div>
                    <span>
                      <CarFront size={13} /> Rescue Unit
                    </span>
                    <strong>{mechanic.unit}</strong>
                  </div>
                  <div>
                    <span>
                      <BadgeCheck size={13} /> Registration
                    </span>
                    <strong className="track-mono">{mechanic.plate}</strong>
                  </div>
                  <div>
                    <span>
                      <Wrench size={13} /> Equipped with
                    </span>
                    <strong>{mechanic.equipment}</strong>
                  </div>
                </div>

                <div className="track-contact">
                  {/* tel: opens the phone dialer on a mobile */}
                  {mechanic.phone && (
                    <a
                      href={"tel:" + mechanic.phone.replace(/[^\d+]/g, "")}
                      className="track-call"
                    >
                      <Phone size={15} /> Call {mechanic.name}
                    </a>
                  )}
                  <button type="button" className="track-message" onClick={() => showNotice("Chat with the mechanic will be added later.")}>
                    <MessageSquare size={16} /> Message
                  </button>
                </div>

                <button type="button" className="track-share" onClick={handleShare}>
                  <Share2 size={14} /> Share Live Status with Family / Insurance
                </button>
              </section>

              {/* Safety card */}
              <section className="gethelp-card track-safety">
                <strong>
                  <ShieldAlert size={16} /> Roadside Safety Reminder
                </strong>
                <p>
                  Stay behind the safety barrier if available. Keep your hazard lights on and wait inside the
                  vehicle if on the busy A15 bridge roadway.
                </p>
                <div className="track-safety-bottom">
                  <span>
                    Batticaloa Police Emergency: <a href="tel:119">119</a>
                  </span>
                  <button type="button" onClick={handleCancel}>
                    Cancel Request
                  </button>
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
                Quoted: {formatRs(assignment.quotation.total)} ({saved.issue || "Service request"})
              </span>
            </div>

            <div className="gh-bottom-right">
              <span>● Step 5 of 6 {arrived ? "completed" : "in progress"}</span>
              {/* Switched off until the mechanic arrives */}
              <button
                type="button"
                className="gh-next-button"
                disabled={!arrived}
                title={arrived ? "" : "Available when the mechanic arrives"}
                onClick={() => navigate("/get-help/summary")}
              >
                Proceed to Settlement
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