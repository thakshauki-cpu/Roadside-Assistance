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
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";



import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import "../../styles/GetHelp.css";
import "leaflet/dist/leaflet.css";

// Landmark choices for the dropdown
// when a customer click the location  it will show the latitude and logitude
const landmarks = [
  "Kallady Bridge (Lady Manning Bridge)",
  "Batticaloa Bus Stand",
  "Batticaloa Teaching Hospital",
  "Gandhi Park",
  "Puliyanthivu Junction",
];
function Location() {
  const navigate = useNavigate();

  //show loading status before  to find api address
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Values typed or chosen by the user
  const [address, setAddress] = useState("A15 Highway near Kallady Bridge, Batticaloa");
  const [landmark, setLandmark] = useState(landmarks[0]);
  const [details, setDetails] = useState("");

  //this the start point of batticaloa map position when customer clck the other location logtitude and latitude will change
  const [coordinates, setCoordinates] = useState({
    latitude: 7.7102,
    longitude: 81.6924,
  });

  // "street" or "satellite" (only changes the button highlight for now)
  const [mapMode, setMapMode] = useState("street");
  const [locationError, setLocationError] = useState("");

  // when customer click the place address will find and it will shown in address input
  const handleMapLocationSelect = async (newCoordinates) => {
    // Update latitude and longitude
    setCoordinates(newCoordinates);

    // Start loading
    setIsAddressLoading(true);
    setLocationError("");

    try {
      // api connecting
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newCoordinates.latitude}&lon=${newCoordinates.longitude}`
      );

      if (!response.ok) {
        throw new Error("Unable to find the address.");
      }

      const data = await response.json();

      if (data.display_name) {
        setAddress(data.display_name);
      } else {
        setLocationError("Address not found. Please enter it manually.");
      }
    } catch (error) {
      console.error("Reverse Geocoding Error:", error);
      setLocationError("Unable to find address. Please enter it manually.");
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCoordinates(nextCoordinates);
        setAddress("Current location");
        setLocationError("");
      },
      () => {
        setLocationError("Unable to access your current location. Please enter it manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save this step's data and go to the next page longtitude latitude order save
  const handleContinue = () => {
    if (!address.trim()) {
      setLocationError("Please enter or select a valid location before continuing.");
      return;
    }

    setLocationError("");

    const saved = JSON.parse(localStorage.getItem("serviceRequest")) || {};

    const updated = {
      ...saved,
      location: {
        address: address.trim(),
        landmark,
        details,
        coordinates: [coordinates.longitude, coordinates.latitude],
      },
    };

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
                  {/* to show the loding message in address input */}
                  {isAddressLoading && (
                    <p className="location-loading">
                      Finding address...
                    </p>
                  )}
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

              {locationError && (
                <p className="location-error">{locationError}</p>
              )}

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
                  <span>Select Your Breakdown Location</span>
                </div>

                <MapContainer
                  center={[7.7102, 81.6924]}
                  zoom={15}
                  scrollWheelZoom={true}
                  className="leaflet-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapClickHandler
                    onLocationSelect={handleMapLocationSelect}
                  />

                  <CircleMarker
                    center={[
                      coordinates.latitude,
                      coordinates.longitude,
                    ]}
                    radius={9}
                    pathOptions={{
                      color: "#ffffff",
                      fillColor: "#285cff",
                      fillOpacity: 1,
                      weight: 3,
                    }}
                  />
                </MapContainer>

                <div className="map-info">
                  <span className="map-info-icon">
                    <Navigation size={18} />
                  </span>

                  <div>
                    <strong>Selected Location</strong>
                    <p>
                      Latitude: {coordinates.latitude.toFixed(5)}
                    </p>
                    <p>
                      Longitude: {coordinates.longitude.toFixed(5)}
                    </p>
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

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    },
  });

  return null;
}

export default Location;