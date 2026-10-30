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
  Navigation,
  MessageSquareQuote,
  Phone,
  X,
  ArrowRight,
  Truck,
  LockKeyhole,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../getHelp/RequestStepper";
import "../../styles/GetHelp.css";

// Sample data. Later this will come from the backend (API).
const mechanic = {
  name: "Siva Auto Care",
  rating: 4.6,
  reviews: 142,
  address: "Kallady Beach Road, Batticaloa",
  distance: "2.1 km away",
  eta: "ETA ~10 mins",
  unit: "Tata Ace Heavy Rescue Van",
  plate: "EP DA 5521",
  specialties: [
    "Emergency Tyre & Brake Specialist",
    "Mobile 150 PSI Air Compressor",
    "3-Ton Rapid Hydraulic Jacks",
    "12V/24V Heavy Duty Jump Starters",
  ],
  labour: 1500,
  parts: 2000,
};

function MechanicFound() {
  const navigate = useNavigate();

  // Countdown timer in seconds (286 seconds = 04:46)
  const [secondsLeft, setSecondsLeft] = useState(286);

  // useEffect runs once when the page opens and starts the timer
  useEffect(() => {
    const timer = setInterval(() => {
      // reduce 1 second, but never go below 0
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    // Stop the timer when the user leaves this page
    return () => clearInterval(timer);
  }, []);

  // Turn seconds into "mm:ss" text
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const total = mechanic.labour + mechanic.parts;

  // User accepts the quotation
  const handleAccept = () => {
    const saved = JSON.parse(localStorage.getItem("serviceRequest")) || {};
    const updated = { ...saved, mechanicName: mechanic.name, total: total };
    localStorage.setItem("serviceRequest", JSON.stringify(updated));

    navigate("/get-help/tracking");
  };

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          {/* Top strip */}
          <div className="summary-strip">
            <span className="summary-chip green">● Batticaloa East Dispatch</span>
            <span>Breakdown at Kallady Bridge Causeway (A15 Highway)</span>
            <strong className="summary-step">
              <ShieldCheck size={13} /> Ticket #BC-84920
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
                Mechanic found <span className="accepted-badge">Accepted</span>
              </h2>
              <p>A verified roadside rescue specialist near Kallady Bridge has accepted your request.</p>
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
                      <BadgeCheck size={13} /> RoadMate Verified Partner
                    </span>

                    <p className="mechanic-rating">
                      <Star size={14} fill="#f5a524" color="#f5a524" />
                      <strong>{mechanic.rating}</strong> ({mechanic.reviews} roadside reviews)
                    </p>

                    <p className="mechanic-address">
                      <MapPin size={13} /> {mechanic.address}
                    </p>

                    <div className="mechanic-badges">
                      <span className="distance-badge">● {mechanic.distance}</span>
                      <span className="eta-badge">
                        <Zap size={13} /> {mechanic.eta}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispatched unit */}
                <div className="unit-box">
                  <span className="vehicle-option-icon">
                    <Truck size={20} />
                  </span>
                  <div>
                    <small>Dispatched Mobile Unit</small>
                    <strong>{mechanic.unit}</strong>
                  </div>
                  <span className="unit-plate">{mechanic.plate}</span>
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
                  <span>
                    <CircleCheck size={14} /> Phone Verified (+94 77 ••• ••89)
                  </span>
                  <span>
                    <CircleCheck size={14} /> Batticaloa HQ Police Cleared
                  </span>
                  <span>
                    <CircleCheck size={14} /> 12 Years Local Experience
                  </span>
                </div>
              </section>

              {/* Route card (placeholder map) */}
              <section className="gethelp-card">
                <div className="route-heading">
                  <h3>
                    <Navigation size={15} /> Proximity &amp; Approach Route
                  </h3>
                  <span>Via Kallady Bridge Rd</span>
                </div>

                <div className="route-map">
                  <div className="route-status">
                    <span>● Mechanic en route standby</span>
                    <strong>2.1 km (8 - 10 min away)</strong>
                  </div>
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
                      <p>Diagnostic inspection, rapid bridge dispatch &amp; on-site repair labour</p>
                    </div>
                    {/* toLocaleString adds the comma: 1500 becomes 1,500 */}
                    <strong>Rs. {mechanic.labour.toLocaleString()}</strong>
                  </div>

                  <div className="quotation-line">
                    <div>
                      <strong>Parts &amp; Consumables</strong>
                      <p>
                        Heavy-duty puncture repair plugs, valve seal replacement &amp; nitrogen
                        refill
                      </p>
                    </div>
                    <strong>Rs. {mechanic.parts.toLocaleString()}</strong>
                  </div>

                  <div className="quotation-total">
                    <div>
                      <small>TOTAL ESTIMATED AMOUNT</small>
                      <span>All taxes &amp; roadside fees included</span>
                    </div>
                    <strong>Rs. {total.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="guarantee-note">
                  <CircleCheck size={16} />
                  <p>
                    <strong>RoadMate Fixed-Price Guarantee:</strong> The mechanic cannot alter this
                    quotation on site without your explicit verbal and in-app consent.
                  </p>
                </div>

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

              <section className="gethelp-card review-quote">
                <span className="vehicle-option-icon">
                  <MessageSquareQuote size={20} />
                </span>
                <p>
                  <strong>"Arrived in 9 mins near Kallady bridge at 9 PM. Very polite."</strong>
                  <br />
                  S. Mahendran • Nissan Sunny Tyre Replacement (3 days ago)
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
                <strong>Call Batticaloa Hotline: 065-222-3333</strong>
              </div>
            </div>

            <div className="gh-bottom-right">
              <button
                type="button"
                className="gh-back-button"
                onClick={() => navigate("/get-help/problem")}
              >
                <X size={16} />
                Reject / Find Another Mechanic
              </button>

              <button type="button" className="gh-next-button" onClick={handleAccept}>
                Accept Quotation &amp; Track Mechanic
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