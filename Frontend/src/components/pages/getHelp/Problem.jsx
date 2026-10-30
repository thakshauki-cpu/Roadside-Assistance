import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleDot,
  BatteryCharging,
  Flame,
  Power,
  Fuel,
  ShieldAlert,
  Truck,
  Ellipsis,
  Check,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../getHelp/RequestStepper";
import "../../styles/GetHelp.css";

// The 8 problem cards. Icons are stored without < > and used later as <Icon />
const issues = [
  {
    name: "Puncture",
    icon: CircleDot,
    text: "Flat or leaking tyre, valve damage, needs spare change or on-site vulcanizing.",
    tag: "Mobile Jack & Air Ready",
  },
  {
    name: "Battery",
    icon: BatteryCharging,
    text: "Jumpstart, drained battery, alternator fault, replacement 12V supply.",
    tag: "12V Booster Pack",
  },
  {
    name: "Engine",
    icon: Flame,
    text: "Overheating, smoke, radiator coolant leak, or abnormal engine knocking.",
    tag: "Coolant & Belts",
  },
  {
    name: "Won't Start",
    icon: Power,
    text: "Ignition clicking, starter motor issue, or central electronic failure.",
    tag: "OBD Scanner Ready",
  },
  {
    name: "Fuel",
    icon: Fuel,
    text: "Ran out of petrol/diesel, contaminated fuel, or clogged pump filter.",
    tag: "Jerry Can Dispatch",
  },
  {
    name: "Accident",
    icon: ShieldAlert,
    text: "Collision recovery, suspension breakage, safe extraction off roadway.",
    tag: "Priority Dispatch",
    danger: true, // shown in red
  },
  {
    name: "Towing",
    icon: Truck,
    text: "Flatbed tow truck needed, locked transmission, immobilized transport.",
    tag: "Flatbed Carrier",
  },
  {
    name: "Other",
    icon: Ellipsis,
    text: "Key lockout, brakes sticking, steering lock, or unspecified mechanical failure.",
    tag: "General Mechanics",
  },
];

function Problem() {
  const navigate = useNavigate();

  // Data saved by the earlier steps (used in the small strip at the top)
  const saved = JSON.parse(localStorage.getItem("serviceRequest")) || {};

  // Name of the selected problem card ("Puncture" is selected at first)
  const [selected, setSelected] = useState("Puncture");

  // Text typed by the user in the description box
  const [description, setDescription] = useState("");

  // Save this step's data and go to the next page
  const handleContinue = () => {
    const updated = {
      ...saved,
      issue: selected,
      issueDescription: description,
    };
    localStorage.setItem("serviceRequest", JSON.stringify(updated));

    navigate("/get-help/mechanic-found");
  };

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          {/* Small summary strip */}
          <div className="summary-strip">
            <span className="summary-chip">Batticaloa Dispatch</span>
            <span>
              {saved.model || "Toyota Axio"} ({saved.plate || "EP CAB 1234"})
            </span>
            <span>{saved.landmark || "Kallady Corridor bypass"}</span>
            <strong className="summary-step">Step 3 of 6</strong>
          </div>

          <RequestStepper currentStep={3} />

          <span className="gethelp-step-label">DIAGNOSTIC TRIAGE</span>

          <div className="gethelp-heading-row">
            <div>
              <h1>What is the problem?</h1>
              <p>
                Select the primary issue affecting your vehicle so we can dispatch the right
                technician and emergency equipment directly along the Kallady corridor.
              </p>
            </div>

            <div className="live-desk">
              <span>● Live Dispatch Desk</span>
              <strong>Batticaloa East Unit Active</strong>
            </div>
          </div>

          {/* ===== Problem cards ===== */}
          <div className="issue-grid">
            {issues.map((item) => {
              const Icon = item.icon;
              const isSelected = selected === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  className={`vehicle-option ${isSelected ? "selected" : ""} ${
                    item.danger ? "danger" : ""
                  }`}
                  onClick={() => setSelected(item.name)}
                >
                  <span className="vehicle-option-check">{isSelected && <Check size={13} />}</span>

                  <span className="vehicle-option-icon">
                    <Icon size={22} />
                  </span>

                  <strong>{item.name}</strong>
                  <span className="issue-text">{item.text}</span>
                  <span className={`issue-tag ${item.danger ? "danger-tag" : ""}`}>{item.tag}</span>
                </button>
              );
            })}
          </div>

          {/* ===== Describe the issue ===== */}
          <section className="gethelp-card">
            <div className="problem-card-heading">
              <h3>
                Describe the issue <small>(Optional)</small>
              </h3>
              {/* description.length counts the typed characters */}
              <span>{description.length} / 300</span>
            </div>

            <p className="gh-help-text">
              Extra context helps the responding Batticaloa technician arrive with the right tools
              and equipment.
            </p>

            <textarea
              className="problem-textarea"
              maxLength={300}
              placeholder="e.g., Rear left tyre punctured after crossing Kallady Bridge, vehicle is pulled safely onto road shoulder with hazard lights on..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <p className="problem-secure">
              <ShieldCheck size={13} /> Your information is transmitted directly to the assigned
              roadside operator only.
            </p>
          </section>

          {/* Info banner */}
          <section className="standards-banner">
            <span className="standards-icon">
              <Truck size={18} />
            </span>
            <div>
              <strong>Rapid Response Units Equipped in Batticaloa</strong>
              <p>
                Technicians stationed near Bar Road &amp; Central Depot carry 3-ton hydraulic
                trolley jacks, 12V jump packs, high-pressure 150 PSI air inflators, and standard
                emergency tooling.
              </p>
            </div>
          </section>

          {/* Bottom bar */}
          <div className="gh-bottom-bar">
            <button
              type="button"
              className="gh-back-button"
              onClick={() => navigate("/get-help/vehicle")}
            >
              <ArrowLeft size={16} />
              Back to Vehicle
            </button>

            <div className="gh-bottom-right">
              <button type="button" className="gh-next-button" onClick={handleContinue}>
                Find Nearby Mechanic
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Problem;