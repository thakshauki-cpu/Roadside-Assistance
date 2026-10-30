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
import { mechanic, issueDetails, defaultPrices, formatRs, timeText, readRequest } from "./requestSampleData";
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

// ----- Simulation settings (change these to make the demo faster or slower) -----
const TOTAL_MINUTES = 10; // starting ETA shown to the customer
const TOTAL_KM = 1.8; // starting distance
const SECONDS_PER_MINUTE = 2; // 1 "minute" on screen passes in 2 real seconds

// Where the van pin starts and where the breakdown pin is (percent of the map box)
const VAN_START = { x: 38, y: 55 };
const BREAKDOWN = { x: 71.5, y: 33.5 };

function Tracking() {
  const navigate = useNavigate();

  // Data saved by the earlier steps
  const saved = readRequest();
  const plate = saved.plate || "EP CAB 1234";
  const issue = issueDetails[saved.issue] || issueDetails.Puncture;
  const quoted = saved.total || defaultPrices.labour + defaultPrices.parts;

  // Seconds since this page opened. Everything live on the page is worked out from it.
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState("");

  // Times shown in the milestone list. useState keeps them fixed while the page is open.
  const [dispatchedAt] = useState(() => timeText(0));
  const [expectedAt] = useState(() => timeText(TOTAL_MINUTES));

  // Start a 1 second timer when the page opens, stop it when the page closes
  useEffect(() => {
    const timer = setInterval(() => setElapsed((previous) => previous + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Work out the live values
  const minutesPassed = Math.floor(elapsed / SECONDS_PER_MINUTE);
  const etaMinutes = Math.max(0, TOTAL_MINUTES - minutesPassed);
  const arrived = etaMinutes === 0;
  const progress = 1 - etaMinutes / TOTAL_MINUTES; // 0 at start, 1 when arrived
  const kmLeft = (TOTAL_KM * etaMinutes) / TOTAL_MINUTES;
  const refreshedAgo = elapsed % 5; // "Refreshed 0-4s ago"

  // Position of the van pin on the map (moves towards the breakdown pin)
  const vanX = VAN_START.x + (BREAKDOWN.x - VAN_START.x) * progress;
  const vanY = VAN_START.y + (BREAKDOWN.y - VAN_START.y) * progress;

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
                <span>Request #RM-BT-8921</span>
                <span>•</span>
                <span>Batticaloa Central Dispatch</span>
                <span>•</span>
                <span className="track-live-text">Live Telemetry</span>
              </div>
              <h1>{arrived ? "Mechanic has arrived" : "Mechanic is on the way"}</h1>
            </div>

            <span className="track-gps-pill">
              <span className="track-gps-dot" />
              Live GPS Connected • Refreshed {refreshedAgo}s ago
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
                  <line x1="24" y1="80" x2="85" y2="22" className="track-route-road" />
                  <line x1={vanX} y1={vanY} x2={BREAKDOWN.x} y2={BREAKDOWN.y} className="track-route-line" />
                </svg>

                {/* Top floating box */}
                <div className="track-floater">
                  <span className="track-floater-road">
                    <Navigation size={15} /> A15 Highway / Bar Road
                  </span>
                  <span className="track-divider" />
                  <span>
                    <Gauge size={14} /> Speed: <b>{arrived ? 0 : 34} km/h</b>
                  </span>
                  <span className="track-divider" />
                  <span>
                    <TrafficCone size={14} /> Traffic: <b className="track-green">Light Flow</b>
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
                    <Truck size={13} /> Siva ({mechanic.unit.split(" ")[0]} {mechanic.plate})
                  </span>
                  <span className="track-pin-circle track-pin-circle-blue">
                    <Wrench size={15} />
                  </span>
                </div>

                {/* Customer breakdown pin */}
                <div className="track-pin track-pin-user" style={{ left: BREAKDOWN.x + "%", top: BREAKDOWN.y + "%" }}>
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
                    <Navigation size={13} /> Heading South on A15 via Kallady Causeway
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
                  <small>Expected at Kallady: {expectedAt}</small>
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
                      <span className="track-photo track-photo-missing" title="Add src/assets/mechanic-siva.png">
                        SA
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
                  <a href={"tel:" + mechanic.phone} className="track-call">
                    <Phone size={15} /> Call Siva
                  </a>
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
                Quoted: {formatRs(quoted)} ({issue.work})
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