
import { useMemo, useState } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  Wrench,
  BatteryCharging,
  Zap,
  Truck,
  Clock3,
  Navigation,
  Plus,
  Minus,
  LocateFixed,
  Layers,
  Grid2X2,
  List,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

import DashboardSidebar from "../Dashboard/Sidebar";
import DashboardTopbar from "../Dashboard/Topbar";
import "../styles/FindMechanic.css";

const mechanics = [                                                                             
  {
    id: 1,
    name: "Mike's Roadside Service",
    rating: "4.9",
    reviews: 128,
    distance: "2.1 km away",
    eta: "6 min ETA",
    status: "Available Now",
    badge: "RoadMate Certified",
    services: ["Tyre Repair", "Battery Jumpstart", "Electrical Diag", "Flatbed Towing"],
    image: "",
  },
  {
    id: 2,
    name: "Chennai Auto Care & Recovery",
    rating: "4.8",
    reviews: 84,
    distance: "2.8 km away",
    eta: "9 min ETA",
    status: "Available Now",
    badge: "Verified Partner",
    services: ["Battery Jumpstart", "Alternator Check", "Engine Diagnostics"],
    image: "",
  },
  {
    id: 3,
    name: "Karthik Quick Tow & Tyre Hub",
    rating: "4.7",
    reviews: 96,
    distance: "3.5 km away",
    eta: "12 min ETA",
    status: "Available Now",
    badge: "Heavy Towing",
    services: ["Tyre Puncture", "Flatbed Towing", "Wheel Alignment"],
    image: "",
  },
  {
    id: 4,
    name: "rithviks Mobile Mechanic Squad",
    rating: "4.9",
    reviews: 210,
    distance: "4.2 km away",
    eta: "15 min ETA",
    status: "Busy (Next slot 20m)",
    badge: "Mobile Mechanic",
    services: ["Fuel Delivery", "Key Lockout Assistance", "Electrical Wiring"],
    image: "",
  },
];

const filters = ["All Services", "Tyre Repair", "Battery", "Towing"];

function FindMechanic() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Services");
  const [selectedId, setSelectedId] = useState(1);
  const [view, setView] = useState("list");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [zoom, setZoom] = useState(1);

  const filteredMechanics = useMemo(() => {
    return mechanics.filter((mechanic) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        mechanic.name.toLowerCase().includes(searchText) ||
        mechanic.services.some((service) =>
          service.toLowerCase().includes(searchText)
        );

      const matchesFilter =
        activeFilter === "All Services" ||
        mechanic.services.some((service) => {
          const value = service.toLowerCase();
          if (activeFilter === "Tyre Repair") return value.includes("tyre");
          if (activeFilter === "Battery") return value.includes("battery");
          if (activeFilter === "Towing") return value.includes("towing");
          return true;
        });

      const matchesAvailability =
        !showAvailableOnly || mechanic.status === "Available Now";

      return matchesSearch && matchesFilter && matchesAvailability;
    });
  }, [search, activeFilter, showAvailableOnly]);

  const selectedMechanic =
    mechanics.find((mechanic) => mechanic.id === selectedId) ||
    filteredMechanics[0];

  const handleDispatch = (mechanic) => {
    alert(`Dispatch request selected for ${mechanic.name}. API connection is not added yet.`);
  };

  return (
    <div className="find-page">
      <DashboardSidebar activeItem="Find Mechanic" />

      <main className="find-main">
        <DashboardTopbar />

        <div className="find-toolbar">
          <div className="find-title">
            <h1>Verified Mechanics</h1>
            <span className="nearby-count">
              {filteredMechanics.length} nearby
            </span>
          </div>

          <div className="find-toolbar-actions">
            <span className="available-summary">
              <span className="online-dot" />
              {filteredMechanics.filter((m) => m.status === "Available Now").length}
              {" "}Available Now
            </span>

            <button
              className={`view-toggle ${view === "list" ? "selected" : ""}`}
              onClick={() => setView("list")}
              aria-label="List view"
              type="button"
            >
              <List size={17} />
            </button>

            <button
              className={`view-toggle ${view === "grid" ? "selected" : ""}`}
              onClick={() => setView("grid")}
              aria-label="Grid view"
              type="button"
            >
              <Grid2X2 size={16} />
            </button>
          </div>
        </div>

        <div className="find-content">
          <section className="mechanic-results">
            <div className="find-search-box">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mechanics or services..."
                aria-label="Search mechanics or services"
              />
              <button
                type="button"
                aria-label="Toggle available mechanics"
                className={showAvailableOnly ? "filter-active" : ""}
                onClick={() => setShowAvailableOnly((value) => !value)}
                title="Show available mechanics only"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>

            <div className="service-filters">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={activeFilter === filter ? "active" : ""}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className={`mechanic-list ${view === "grid" ? "grid-view" : ""}`}>
              {filteredMechanics.map((mechanic) => (
                <article
                  key={mechanic.id}
                  className={`mechanic-card ${
                    selectedId === mechanic.id ? "mechanic-selected" : ""
                  }`}
                  onClick={() => setSelectedId(mechanic.id)}
                >
                  <div className="mechanic-card-top">
                    {mechanic.image ? (
                      <img
                        className="mechanic-avatar"
                        src={mechanic.image}
                        alt=""
                      />
                    ) : (
                      <div className="mechanic-avatar mechanic-avatar-placeholder">
                        <Truck size={24} />
                      </div>
                    )}

                    <div className="mechanic-info">
                      <h2>{mechanic.name}</h2>

                      <span className="mechanic-badge">
                        <ShieldCheck size={12} />
                        {mechanic.badge}
                      </span>

                      <div className="mechanic-meta">
                        <span className="rating">
                          <Star size={13} fill="currentColor" />
                          <strong>{mechanic.rating}</strong>
                          <span>({mechanic.reviews} reviews)</span>
                        </span>
                        <span className="distance">
                          <Navigation size={12} />
                          {mechanic.distance}
                        </span>
                      </div>

                      <span className="eta-badge">
                        <Clock3 size={11} />
                        {mechanic.eta}
                      </span>
                    </div>

                    <span
                      className={`availability-badge ${
                        mechanic.status !== "Available Now" ? "busy" : ""
                      }`}
                    >
                      <span />
                      {mechanic.status}
                    </span>
                  </div>

                  <div className="mechanic-services">
                    {mechanic.services.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>

                  <div className="mechanic-card-actions">
                    <button
                      type="button"
                      className="profile-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        alert(`Profile for ${mechanic.name}`);
                      }}
                    >
                      View Profile <span>→</span>
                    </button>

                    <button
                      type="button"
                      className="dispatch-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDispatch(mechanic);
                      }}
                    >
                      <Zap size={13} />
                      {mechanic.status === "Available Now"
                        ? "Request Dispatch"
                        : "Pre-book Dispatch"}
                    </button>
                  </div>
                </article>
              ))}

              {filteredMechanics.length === 0 && (
                <div className="no-mechanics">
                  <Search size={28} />
                  <h3>No mechanics found</h3>
                  <p>Try another service or search term.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveFilter("All Services");
                      setShowAvailableOnly(false);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="find-map-column">
            <div className="map-panel">
              <div className="map-background">
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-road road-three" />
                <div className="map-road road-four" />

                <div className="map-area-label label-one">valaichchenai ROAD</div>
                <div className="map-area-label label-two">Batticaloa town</div>
                <div className="map-area-label label-three">SERVICE AREA</div>

                <button
                  type="button"
                  className="map-marker marker-one"
                  onClick={() => setSelectedId(1)}
                  aria-label="Select Mike's Roadside Service"
                >
                  <Wrench size={16} />
                </button>

                <button
                  type="button"
                  className="map-marker marker-two"
                  onClick={() => setSelectedId(2)}
                  aria-label="Select Chennai Auto Care"
                >
                  <Truck size={16} />
                </button>

                <button
                  type="button"
                  className="map-marker marker-three"
                  onClick={() => setSelectedId(3)}
                  aria-label="Select Karthik Quick Tow"
                >
                  <Wrench size={16} />
                </button>

                <button
                  type="button"
                  className="map-marker marker-four"
                  onClick={() => setSelectedId(4)}
                  aria-label="Select Velachery Mobile Mechanic"
                >
                  <BatteryCharging size={16} />
                </button>

                <div className="map-current-location">
                  <span />
                </div>

                {selectedMechanic && (
                  <div className="map-mechanic-popup">
                    <div className="popup-topline">
                      <span className="fast-responder">
                        Fastest Responder
                      </span>
                      <span className="popup-rating">
                        <Star size={12} fill="currentColor" />
                        {selectedMechanic.rating}
                      </span>
                    </div>

                    <h3>{selectedMechanic.name}</h3>
                    <p>
                      OMR Corridor · <strong>{selectedMechanic.eta}</strong>
                      {" "}({selectedMechanic.distance})
                    </p>

                    <button
                      type="button"
                      onClick={() => handleDispatch(selectedMechanic)}
                    >
                      <Zap size={13} />
                      Instant Dispatch
                    </button>
                  </div>
                )}

                <div className="map-controls">
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.min(value + 0.1, 1.3))}
                    aria-label="Zoom in"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.max(value - 0.1, 0.8))}
                    aria-label="Zoom out"
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId(1)}
                    aria-label="Reset map selection"
                  >
                    <LocateFixed size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Connect a real map provider to use map layers.")}
                    aria-label="Map layers"
                  >
                    <Layers size={17} />
                  </button>
                </div>

                <div
                  className="map-zoom-layer"
                  style={{ transform: `scale(${zoom})` }}
                />

                <span className="map-car-label">Your Breakdown Car</span>

                <div className="map-legend">
                  <span><i className="legend-blue" /> Mechanics</span>
                  <span><i className="legend-location" /> Your location</span>
                </div>
              </div>

              <button
                className="live-route-button"
                type="button"
                onClick={() =>
                  alert("Live route will be available after connecting a map API.")
                }
              >
                View Live Route <span>→</span>
              </button>
            </div>

            <div className="map-trust-cards">
              <div>
                <ShieldCheck size={17} />
                <span>
                  <strong>Identity Verified</strong>
                  <small>Checked profiles</small>
                </span>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <span>
                  <strong>No Surprise Pricing</strong>
                  <small>Transparent estimates</small>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default FindMechanic;



// request 

// quotation 
// onway

// completed 
// payment 
// review