
import { useEffect, useState } from "react";

import {
  ArrowRight,
  BellRing,
  CheckCircle,
  Fuel,
  MapPin,
  Navigation,
  PhoneCall,
  Star,
  Wrench,
  History,
  Sparkles,
  CarFront,
  Clock,
  ClipboardList,
} from "lucide-react";

import "./Welcome.css";
import { useNavigate } from "react-router-dom";

function WelcomeSection() {
  const navigate = useNavigate();

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login to view your dashboard.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setDashboardData(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="welcome-dashboard">
        <p>Loading your dashboard...</p>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="welcome-dashboard">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </section>
    );
  }

  if (!dashboardData) return null;

  // Backend data
  const {
    customer,
    overview,
    primaryVehicle,
    activeRequest,
    recentRequests,
    nearbyMechanics,
  } = dashboardData;

  const firstName = customer?.fullName?.split(" ")[0] || "Customer";

  // Use active request first, otherwise latest history
  const recentRequest = activeRequest || recentRequests?.[0] || null;

  // Format date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format request status
  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <section className="welcome-dashboard">

      {/* Greeting */}
      <div className="dashboard-greeting">
        <b>
          Welcome,
          <br /><br />
          {firstName}!
        </b>
      </div>

      {/* Top cards */}
      <div className="welcome-top-grid">

        {/* Roadside assistance banner */}
        <section className="roadside-banner">
          <div className="roadside-banner-content">
            <h2>
              Get Help –
              <br />
              Roadside assistance
              <br />
              when you need it
            </h2>

            <div className="roadside-service-tags">
              <span>Flat Tyre</span>
              <span>Battery Jumpstart</span>
              <span>Towing</span>
              <span>Fuel Delivery</span>
            </div>

            <button
              type="button"
              className="get-help-button"
              onClick={() => navigate("/get-help/location")}
            >
              <span>
                Get Help
                <br />
                Now
              </span>
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="roadside-banner-image">
            <img
              src="/src/assets/front map.PNG"
              alt="Vehicle roadside assistance"
            />
          </div>
        </section>

        {/* Vehicle card */}
        <section className="vehicle-card">

          <div className="vehicle-card-heading">
            <div className="vehicle-title">
              <h3>Your Vehicle</h3>

              {primaryVehicle && (
                <span className="primary-badge">
                  {primaryVehicle.isPrimary ? "Primary" : "Latest"}
                </span>
              )}
            </div>

            <button
              type="button"
              className="switch-vehicle-button"
              onClick={() => navigate("/get-help/vehicle")}
            >
              ↔ Switch
            </button>
          </div>

          {primaryVehicle ? (
            <>
              <div className="vehicle-details">
                <div>
                  <h4>{primaryVehicle.model}</h4>
                  <p>{primaryVehicle.vehicleType}</p>
                </div>

                <div className="vehicle-plate">
                  <span className="plate-country">LK</span>
                  <span>
                    {primaryVehicle.registrationNumber || "Not added"}
                  </span>
                </div>
              </div>

              <div className="vehicle-image">
                <img
                  src="/src/assets/Car.PNG"
                  alt="Customer vehicle"
                />
              </div>

              <div className="vehicle-info-strip">
                <div>
                  <span>Vehicle Type</span>
                  <strong>
                    <CarFront size={12} />
                    {primaryVehicle.vehicleType}
                  </strong>
                </div>

                <div>
                  <span>Added On</span>
                  <strong>
                    {formatDate(primaryVehicle.createdAt).split(",")[0]}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="vehicle-details">
              <div>
                <h4>No Vehicle Added</h4>
                <p>Add your vehicle details to get started.</p>
                <button
                  type="button"
                  onClick={() => navigate("/get-help/vehicle")}
                >
                  Add Vehicle
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom cards */}
      <div className="welcome-bottom-grid">

        {/* Recent request */}
        <section className="dashboard-card recent-request-card">

          <div className="dashboard-card-heading">
            <div className="dashboard-heading-title">
              <span className="dashboard-heading-icon">
                <History size={16} />
              </span>
              <h3>Recent Request</h3>
            </div>

            <button
              type="button"
              className="text-action"
              onClick={() => navigate("/get-help/location")}
            >
              New Request
            </button>
          </div>

          {recentRequest ? (
            <>
              <div className="request-details-box">

                <div className="request-title-row">
                  <h4>{recentRequest.problem}</h4>

                  <span className="completed-badge">
                    ● {formatStatus(recentRequest.status)}
                  </span>
                </div>

                <p className="request-date">
                  {formatDate(recentRequest.createdAt)}
                </p>

                <div className="request-mechanic">
                  <MapPin size={13} />
                  <strong>
                    {recentRequest.location?.address || "Location unavailable"}
                  </strong>
                </div>

                {recentRequest.mechanic && (
                  <div className="request-mechanic">
                    <Wrench size={13} />
                    <strong>
                      {recentRequest.mechanic.fullName}
                    </strong>
                  </div>
                )}

                <div className="request-rating">
                  <span>
                    {recentRequest.description || "Service request details"}
                  </span>
                </div>

              </div>

              <button
                type="button"
                className="invoice-button"
                onClick={() =>
                  navigate(
                    activeRequest
                      ? "/get-help/tracking"
                      : "/get-help/summary"
                  )
                }
              >
                {activeRequest ? "Track Request" : "View Request Details"}
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <div className="request-details-box">
              <h4>No Service Requests Yet</h4>
              <p>Create your first roadside assistance request.</p>
            </div>
          )}
        </section>

        {/* Nearby mechanics */}
        <section className="dashboard-card nearby-mechanics-card">

          <div className="dashboard-card-heading">
            <div className="dashboard-heading-title">
              <span className="dashboard-heading-icon">
                <Navigation size={16} />
              </span>
              <h3>Nearby Mechanics</h3>
            </div>

            <span className="active-mechanics-count">
              ● {nearbyMechanics.length} Available
            </span>
          </div>

          {nearbyMechanics.length > 0 ? (
            nearbyMechanics.slice(0, 3).map((mechanic) => (
              <div
                className="mechanic-details-box"
                key={mechanic._id}
              >
                <div className="mechanic-name-row">
                  <h4>{mechanic.businessName}</h4>

                  <span className="available-badge">
                    ● Available
                  </span>
                </div>

                <div className="mechanic-distance">
                  <MapPin size={13} />
                  <span>
                    {mechanic.location?.address || "Location unavailable"}
                  </span>
                </div>

                <div className="mechanic-tags">
                  {mechanic.services?.slice(0, 3).map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="mechanic-details-box">
              <h4>No Mechanics Available</h4>
              <p>Available mechanics will appear here.</p>
            </div>
          )}

          <button
            type="button"
            className="view-mechanics-button"
            aria-label="View more mechanics"
            onClick={() => navigate("/find-mechanic")}
          >
            <ArrowRight size={16} />
          </button>
        </section>

        {/* Recent alerts */}
        <section className="dashboard-card recent-alerts-card">

          <div className="dashboard-card-heading">
            <div className="dashboard-heading-title">
              <span className="dashboard-heading-icon">
                <BellRing size={16} />
              </span>
              <h3>Recent Alerts</h3>
            </div>
          </div>

          <div className="alert-item">
            <span className="alert-icon alert-service">
              <Clock size={15} />
            </span>

            <div className="alert-content">
              <h4>Notifications Coming Soon</h4>
              <p>
                Your service updates and notifications will appear here.
              </p>
            </div>
          </div>

          <div className="road-advice">
            <span>Need road advice?</span>

            <button type="button">
              Ask RoadMate AI
              <Sparkles size={12} />
            </button>
          </div>
        </section>

      </div>
    </section>
  );
}

export default WelcomeSection;
