import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crosshair,
  MapPin,
  X,
  Landmark,
  ArrowLeft,
  ArrowRight,
  Navigation,
  Plus,
  Minus,
  Asterisk,
  TrafficCone,
  CarFront,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import "../../styles/GetHelp.css";

// Landmark choices for the dropdown
const landmarks = [
  "Kallady Bridge (Lady Manning Bridge)",
  "Batticaloa Bus Stand",
  "Batticaloa Teaching Hospital",
  "Gandhi Park",
  "Puliyanthivu Junction",
];

function Location() {
  const navigate = useNavigate();

  // Values typed or chosen by the user
  const [address, setAddress] = useState("A15 Highway near Kallady Bridge, Batticaloa");
  const [landmark, setLandmark] = useState(landmarks[0]);
  const [details, setDetails] = useState("");

  // "street" or "satellite" (only changes the button highlight for now)
  const [mapMode, setMapMode] = useState("street");

  // Real GPS will be added later. For now we fill a sample text.
  const handleUseCurrentLocation = () => {
    setAddress("Current GPS location (Batticaloa)");
  };

  // Save this step's data and go to the next page
  const handleContinue = () => {
    // Read old request data (or an empty object if nothing is saved)
    const saved = JSON.parse(localStorage.getItem("serviceRequest")) || {};

    // "...saved" copies the old data, then we add the new fields
    const updated = { ...saved, address: address, landmark: landmark, details: details };
    localStorage.setItem("serviceRequest", JSON.stringify(updated));

    navigate("/get-help/vehicle");
  };

  return (
    <div className="gethelp-page">
      {/* activeItem highlights "My Requests" in the sidebar */}
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          <RequestStepper currentStep={1} />

          <span className="gethelp-tag">
            <MapPin size={12} /> Request Roadside Assistance • Batticaloa Eastern Province
          </span>

          {/* Heading and active vehicle chip */}
          <div className="gethelp-heading-row">
            <div>
              <h1>Where are you?</h1>
              {/* <p>
                Pinpoint your current breakdown location in Batticaloa so the nearest
                dispatch mechanic can reach you quickly with the correct towing and
                recovery equipment.
              </p> */}
            </div>

            <div className="gethelp-info-chip">
              <CarFront size={16} />
              <div>
                <span>Active Vehicle</span>
                <strong>EP CAB 1234 • Toyota Axio (White)</strong>
              </div>
            </div>
          </div>

          <div className="location-grid">
            {/* ===== Left column ===== */}
            <div className="location-left">
              {/* Automatic detection */}
              <section className="gethelp-card">
                <div className="location-gps-top">
                  <span>Automatic Detection</span>
                  <span className="gps-badge">● GPS Accuracy: High (&lt;10m)</span>
                </div>

                <button type="button" className="gps-button" onClick={handleUseCurrentLocation}>
                  <Crosshair size={18} />
                  Use My Current Location
                </button>
              </section>

              {/* Address form */}
              <section className="gethelp-card">
                <label className="gh-label" htmlFor="address">
                  Or Enter / Confirm Exact Address
                </label>
                <div className="gh-input-wrap">
                  <MapPin size={16} />
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                  {/* X button clears the address */}
                  <button type="button" className="gh-clear" onClick={() => setAddress("")}>
                    <X size={15} />
                  </button>
                </div>

                <div className="gh-label-row">
                  <label className="gh-label" htmlFor="landmark">
                    Nearest Recognizable Landmark
                  </label>
                  <span className="gh-hint">Crucial for Driver ETA</span>
                </div>
                <div className="gh-input-wrap">
                  <Landmark size={16} />
                  <select
                    id="landmark"
                    value={landmark}
                    onChange={(event) => setLandmark(event.target.value)}
                  >
                    {landmarks.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="landmark-verified">
                  <strong>Nearby Landmark Verified</strong>
                  <p>
                    {landmark} • 250m away. Wide dual-lane access suitable for flatbed tow
                    trucks.
                  </p>
                </div>

                <label className="gh-label" htmlFor="details">
                  Specific roadside details (optional)
                </label>
                <input
                  id="details"
                  className="gh-plain-input"
                  type="text"
                  placeholder="e.g. Parked by the coconut stall, hazard lights on"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                /> */}
              </section>

              {/* Emergency card */}
              <section className="danger-card">
                <span className="danger-icon">
                  <Asterisk size={20} />
                </span>
                <div className="danger-text">
                  <strong>Critical Danger / Injuries?</strong>
                  <p>Dial 119 (Police) or 1990 (Suwa Seriya Ambulance)</p>
                </div>
                {/* tel: opens the phone dialer on mobile */}
                <a href="tel:1990" className="danger-call">
                  Call 1990
                </a>
              </section>
            </div>

            {/* ===== Right column: map ===== */}
            <div className="location-right">
              {/* Placeholder map. A real map will be added later. */}
              <div className="map-box">
                <div className="map-toggle">
                  <button
                    type="button"
                    className={mapMode === "street" ? "selected" : ""}
                    onClick={() => setMapMode("street")}
                  >
                    Street Vector
                  </button>
                  <button
                    type="button"
                    className={mapMode === "satellite" ? "selected" : ""}
                    onClick={() => setMapMode("satellite")}
                  >
                    Satellite
                  </button>
                </div>

                <div className="map-road" />
                <div className="map-pin">
                  <Navigation size={13} /> Your Breakdown Location
                </div>

                <div className="map-zoom">
                  <button type="button" aria-label="Zoom in">
                    <Plus size={16} />
                  </button>
                  <button type="button" aria-label="Zoom out">
                    <Minus size={16} />
                  </button>
                </div>

                <div className="map-info">
                  <span className="map-info-icon">
                    <Navigation size={18} />
                  </span>
                  <div>
                    <strong>Kallady Bridge Causeway, Batticaloa</strong>
                    <p>3 Mechanics within 3 km • Fastest ETA: 12 mins</p>
                  </div>
                </div>
              </div>

              
            </div>
          </div>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <button type="button" className="gh-back-button" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} />
              Cancel &amp; Return to Dashboard
            </button>

            <div className="gh-bottom-right">
              <span>Step 1 of 6 Completed</span>
              <button type="button" className="gh-next-button" onClick={handleContinue}>
                Continue to Vehicle Details
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Location;