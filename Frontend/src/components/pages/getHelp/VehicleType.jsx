import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CarFront,
  Bus,
  Bike,
  Truck,
  Tractor,
  Check,
  MapPin,
  BadgeCheck,
  History,
  Palette,
  CircleCheck,
  Timer,
  Wrench,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../getHelp/RequestStepper";
import "../../styles/GetHelp.css";

// The 5 vehicle cards. "icon" is a component, so we store it without < >.
// Profile texts and response times are sample data for now.
const vehicleOptions = [
  {
    name: "Car",
    sub: "Sedan, Hatch, SUV",
    examples: "Axio, Prius, Aqua, Alto",
    icon: CarFront,
    profile: "Car Rescue Profile",
    equipment: "Flatbed or Wheel-lift towing equipment",
    response: "12-18 min",
  },
  {
    name: "Van",
    sub: "Micro Van, Commuter",
    examples: "HiAce, Caravan, Every",
    icon: Bus,
    profile: "Van Rescue Profile",
    equipment: "Heavy flatbed towing equipment",
    response: "15-20 min",
  },
  {
    name: "Motorbike",
    sub: "Scooter, Heavy Bike",
    examples: "CT 100, FZ, Activa, Dio",
    icon: Bike,
    profile: "Bike Rescue Profile",
    equipment: "Bike carrier and on-site repair kit",
    response: "10-15 min",
  },
  {
    name: "Three-Wheeler",
    sub: "Tuk-Tuk, Autorickshaw",
    examples: "Bajaj RE, TVS King",
    icon: Truck,
    profile: "Three-Wheeler Rescue Profile",
    equipment: "Light recovery and on-site repair kit",
    response: "10-15 min",
  },
  {
    name: "Other",
    sub: "Light Truck, Tractor",
    examples: "Lorry, Dimo Batta",
    icon: Tractor,
    profile: "Heavy Rescue Profile",
    equipment: "Heavy-duty recovery truck",
    response: "20-30 min",
  },
];

function VehicleType() {
  const navigate = useNavigate();

  // Name of the selected card ("Car" is selected at first)
  const [selected, setSelected] = useState("Car");
  const [plate, setPlate] = useState("EP CAB 1234");
  const [model, setModel] = useState("Toyota Axio - Silver Metallic");
  const [applied, setApplied] = useState(true);

  // Find the full object of the selected vehicle (to show its profile on the right)
  const selectedVehicle = vehicleOptions.find((item) => item.name === selected);
  const ProfileIcon = selectedVehicle.icon;

  // Fill the form using the saved vehicle from the profile
  const handleQuickSelect = () => {
    setPlate("EP CAB 1234");
    setModel("Toyota Axio - Silver Metallic");
    setApplied(true);
  };

const handleContinue = () => {
  const saved =
    JSON.parse(localStorage.getItem("serviceRequest")) || {};

  // Match frontend vehicle names with backend enum values
  const vehicleType =
    selected === "Motorbike"
      ? "Bike"
      : selected === "Three-Wheeler"
      ? "Three Wheeler"
      : selected;

  const updated = {
    ...saved,

    vehicle: {
      vehicleType,
      model: model.trim(),
      registrationNumber: plate.trim().toUpperCase(),
    },
  };

  localStorage.setItem("serviceRequest", JSON.stringify(updated));

  navigate("/get-help/problem");
};

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          <RequestStepper currentStep={2} />

          <span className="gethelp-step-label">● STEP 2: FLEET CATEGORY</span>

          <div className="gethelp-heading-row">
            <div>
              <h1>Select your vehicle</h1>
              <p>Choose the vehicle type needing roadside rescue in Batticaloa or Eastern Province.</p>
            </div>

            <div className="gethelp-info-chip">
              <MapPin size={16} />
              <div>
                <span>Dispatch Zone</span>
                <strong>Kallady Bridge / A4 Corridor</strong>
              </div>
            </div>
          </div>

          {/*  Vehicle cards  */}
          <div className="vehicle-option-grid">
            {vehicleOptions.map((item) => {
              const Icon = item.icon; // component name must start with a capital letter
              const isSelected = selected === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  className={`vehicle-option ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelected(item.name)}
                >
                  {/* Tick circle in the top right corner */}
                  <span className="vehicle-option-check">
                    {isSelected && <Check size={13} />}
                  </span>

                  <span className="vehicle-option-icon">
                    <Icon size={22} />
                  </span>

                  <strong>{item.name}</strong>
                  <small>{item.sub}</small>

                  <span className="vehicle-option-examples">
                    Examples:
                    <br />
                    {item.examples}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Details  */}
          <section className="gethelp-card vehicle-details-card">
            <div className="vehicle-details-grid">
              {/* Left: form */}
              <div>
                <div className="vehicle-plate-heading">
                  <h3>
                    Vehicle Registration Number <small>(Optional)</small>
                  </h3>
                  <span className="plate-format">
                    <BadgeCheck size={13} /> Sri Lanka Plate Format
                  </span>
                </div>

                <p className="gh-help-text">
                  Providing your license plate helps the mechanic identify your vehicle faster on
                  busy Batticaloa thoroughfares.
                </p>

                <div className="plate-input">
                  <span className="plate-prefix">LK</span>
                  <input
                    type="text"
                    value={plate}
                    onChange={(event) => {
                      setPlate(event.target.value.toUpperCase()); // plates are capital letters
                      setApplied(false);
                    }}
                  />
                </div>

                <div className="quick-select">
                  <History size={18} />
                  <div>
                    <small>Quick select from profile</small>
                    <strong>EP CAB 1234 • Toyota Axio (Silver)</strong>
                  </div>
                  <button type="button" className="applied-button" onClick={handleQuickSelect}>
                    {applied ? "Applied ✓" : "Apply"}
                  </button>
                </div>

                <label className="gh-label" htmlFor="model">
                  Vehicle Model &amp; Color <small>(Optional)</small>
                </label>
                <div className="gh-input-wrap">
                  <input
                    id="model"
                    type="text"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                  />
                  <Palette size={16} />
                </div>
              </div>

              {/* Right: rescue profile of the selected vehicle */}
              <div className="dispatch-matrix">
                <div className="dispatch-matrix-top">
                  <span>RESCUE UNIT DISPATCH MATRIX</span>
                  <span className="auto-badge">Auto-assigned</span>
                </div>

                <div className="dispatch-profile">
                  <span className="vehicle-option-icon">
                    <ProfileIcon size={22} />
                  </span>
                  <div>
                    <strong>{selectedVehicle.profile}</strong>
                    <p>{selectedVehicle.equipment}</p>
                  </div>
                </div>

                <ul className="dispatch-list">
                  <li>
                    <CircleCheck size={15} /> Calibrated for sandy lagoon shoulders &amp; coastal tarmac
                  </li>
                  <li>
                    <CircleCheck size={15} /> Hydraulic jack &amp; battery booster compatible with 12V cars
                  </li>
                  <li>
                    <CircleCheck size={15} /> Response radius covers Kallady, Urani &amp; Eravur sectors
                  </li>
                </ul>

                <div className="dispatch-response">
                  <span>
                    <Timer size={15} /> Avg. Batticaloa Response:
                  </span>
                  <strong>{selectedVehicle.response}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Info banner */}
          <section className="standards-banner">
            <span className="standards-icon">
              <Wrench size={18} />
            </span>
            <div>
              <strong>Batticaloa Roadway &amp; Bridge Recovery Standards</strong>
              <p>
                Assistance is dispatched with vehicle-specific recovery tools and towing equipment
                tailored for Batticaloa roadways, bridge crossings, and coastal terrain. Selecting
                the right vehicle category prevents towing mismatch delays.
              </p>
            </div>
          </section>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <button
              type="button"
              className="gh-back-button"
              onClick={() => navigate("/get-help/location")}
            >
              <ArrowLeft size={16} />
              Back to Location
            </button>

            <div className="gh-bottom-right">
              <span>Next: Pinpoint tire, battery, or mechanical breakdown</span>
              <button type="button" className="gh-next-button" onClick={handleContinue}>
                Continue to Issue Details
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VehicleType;