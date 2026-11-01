
import { useMemo, useState, useEffect } from "react";
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

const filters = ["All Services", "Tyre Repair", "Battery", "Towing"];

function FindMechanic() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Services");
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("list");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login to view mechanics.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/mechanics`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch mechanics.");
        }

        setMechanics(data.mechanics || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  const filteredMechanics = useMemo(() => {
    return mechanics.filter((mechanic) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        mechanic.businessName?.toLowerCase().includes(searchText) ||
        mechanic.user?.fullName?.toLowerCase().includes(searchText) ||
        mechanic.services?.some((service) =>
          service.toLowerCase().includes(searchText)
        ) ||
        mechanic.location?.address?.toLowerCase().includes(searchText);

      const matchesFilter =
        activeFilter === "All Services" ||
        mechanic.services?.some((service) => {
          if (activeFilter === "Tyre Repair") {
            return service === "Tyre Repair";
          }

          if (activeFilter === "Battery") {
            return service === "Battery Jumpstart";
          }

          if (activeFilter === "Towing") {
            return service === "Towing";
          }

          return true;
        });

      const matchesAvailability =
        !showAvailableOnly || mechanic.isAvailable;

      return matchesSearch && matchesFilter && matchesAvailability;
    });
  }, [mechanics, search, activeFilter, showAvailableOnly]);

  const selectedMechanic =
    filteredMechanics.find((mechanic) => mechanic._id === selectedId) ||
    filteredMechanics[0];

  const handleDispatch = (mechanic) => {
    if (!mechanic.isAvailable) {
      alert("This mechanic is currently unavailable.");
      return;
    }

    alert(
      `Selected mechanic: ${mechanic.businessName}. Dispatch API will be connected later.`
    );
  };

  return (
    <div className="find-page">
      <DashboardSidebar activeItem="Find Mechanic" />

      <main className="find-main">
        <DashboardTopbar />

        <div className="find-toolbar">
          <div className="find-title">
            <h1>Find Mechanics</h1>
            <span className="nearby-count">
              {filteredMechanics.length} nearby
            </span>
          </div>

          <div className="find-toolbar-actions">
            <span className="available-summary">
              <span className="online-dot" />
              {mechanics.filter((m) => m.isAvailable).length}
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

              {loading && <p>Loading mechanics...</p>}

              {error && <p>{error}</p>}

              {!loading && !error && filteredMechanics.map((mechanic) => (
                <article
                  key={mechanic._id}
                  className={`mechanic-card ${
                    selectedId === mechanic._id ? "mechanic-selected" : ""
                  }`}
                  onClick={() => setSelectedId(mechanic._id)}
                >
                  <div className="mechanic-card-top">
                    <div className="mechanic-avatar mechanic-avatar-placeholder">
                      <Truck size={24} />
                    </div>

                    <div className="mechanic-info">
                      <h2>{mechanic.businessName}</h2>

                      <span className="mechanic-badge">
                        <ShieldCheck size={12} />
                        {mechanic.isVerified
                          ? "Verified Partner"
                          : "Verification Pending"}
                      </span>

                      <div className="mechanic-meta">
                        <span className="rating">
                          <Wrench size={13} />
                          <strong>{mechanic.experience || 0}</strong>
                          <span>years experience</span>
                        </span>

                        <span className="distance">
                          <Navigation size={12} />
                          {mechanic.location?.address || "Address not available"}
                        </span>
                      </div>

                      <span className="eta-badge">
                        <Clock3 size={11} />
                        {mechanic.user?.fullName || "Mechanic"}
                      </span>
                    </div>

                    <span
                      className={`availability-badge ${
                        !mechanic.isAvailable ? "busy" : ""
                      }`}
                    >
                      <span />
                      {mechanic.isAvailable ? "Available Now" : "Unavailable"}
                    </span>
                  </div>

                  <div className="mechanic-services">
                    {mechanic.services?.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>

                  <div className="mechanic-card-actions">
                    <button
                      type="button"
                      className="profile-action"
                      onClick={(event) => {
                        event.stopPropagation();

                        alert(
                          `Mechanic: ${mechanic.businessName}\nName: ${mechanic.user?.fullName || "N/A"}\nPhone: ${mechanic.phone}\nExperience: ${mechanic.experience} years\nAddress: ${mechanic.location?.address}`
                        );
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
                      {mechanic.isAvailable
                        ? "Request Dispatch"
                        : "Currently Unavailable"}
                    </button>
                  </div>
                </article>
              ))}

              {!loading && !error && filteredMechanics.length === 0 && (
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

                {filteredMechanics.slice(0, 4).map((mechanic, index) => {
                  const markerClasses = [
                    "marker-one",
                    "marker-two",
                    "marker-three",
                    "marker-four",
                  ];

                  return (
                    <button
                      key={mechanic._id}
                      type="button"
                      className={`map-marker ${markerClasses[index]}`}
                      onClick={() => setSelectedId(mechanic._id)}
                      aria-label={`Select ${mechanic.businessName}`}
                    >
                      {index === 1 ? (
                        <Truck size={16} />
                      ) : index === 3 ? (
                        <BatteryCharging size={16} />
                      ) : (
                        <Wrench size={16} />
                      )}
                    </button>
                  );
                })}

                <div className="map-current-location">
                  <span />
                </div>

                {selectedMechanic && (
                  <div className="map-mechanic-popup">
                    <div className="popup-topline">
                      <span className="fast-responder">
                        Mechanic Details
                      </span>
                      <span className="popup-rating">
                        <Star size={12} />
                        {selectedMechanic.experience || 0} years
                      </span>
                    </div>

                    <h3>{selectedMechanic.businessName}</h3>

                    <p>
                      {selectedMechanic.location?.address || "Address not available"}
                      {" · "}
                      <strong>
                        {selectedMechanic.isAvailable
                          ? "Available"
                          : "Unavailable"}
                      </strong>
                    </p>

                    <button
                      type="button"
                      onClick={() => handleDispatch(selectedMechanic)}
                    >
                      <Zap size={13} />
                      Request Dispatch
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
                    onClick={() => setSelectedId(filteredMechanics[0]?._id || null)}
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
                  <strong>Mechanic Profiles</strong>
                  <small>Profile information</small>
                </span>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <span>
                  <strong>Service Information</strong>
                  <small>Available services</small>
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