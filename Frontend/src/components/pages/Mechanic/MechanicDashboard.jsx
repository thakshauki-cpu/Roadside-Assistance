import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";
import {
  getMechanicProfile,
  getPendingServiceRequests,
  updateMechanicAvailability,
} from "../../../api/mechanic";

import "../../styles/Mechanic/MechanicDashboard.css";

function MechanicDashboard() {
  const [profile, setProfile] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  useEffect(() => {
    let active = true;

    getMechanicProfile()
      .then(({ profile: mechanicProfile }) => {
        if (active) {
          setProfile(mechanicProfile);
        }
      })
      .catch((error) => {
        if (active) {
          setAvailabilityError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setAvailabilityLoading(false);
        }
      });

    getPendingServiceRequests()
      .then(({ requests: pendingRequests }) => {
        if (active) {
          setRequests(pendingRequests);
        }
      })
      .catch((error) => {
        if (active) {
          setRequestsError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setRequestsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleAvailability = useCallback(async () => {
    if (!profile || availabilityUpdating) {
      return;
    }

    setAvailabilityUpdating(true);
    setAvailabilityError("");
    try {
      const { isAvailable } = await updateMechanicAvailability(
        !profile.isAvailable
      );
      setProfile((currentProfile) =>
        currentProfile
          ? { ...currentProfile, isAvailable }
          : currentProfile
      );
    } catch (error) {
      setAvailabilityError(error.message);
    } finally {
      setAvailabilityUpdating(false);
    }
  }, [availabilityUpdating, profile]);

  const mechanicName = profile?.user?.fullName || "Mechanic";

  return (
    <div className="mechanic-dashboard">

      {/* Reusable Sidebar */}
      <MechanicSidebar
        activeItem="Dashboard"
        pendingCount={requests.length}
        isAvailable={profile?.isAvailable}
        availabilityLoading={availabilityLoading}
        availabilityUpdating={availabilityUpdating}
        availabilityError={availabilityError}
        onToggleAvailability={
          profile ? handleToggleAvailability : undefined
        }
      />

      {/* Main section */}
      <main className="mechanic-main">

        {/* Reusable Topbar */}
        <MechanicTopbar mechanicName={mechanicName} />

        {/* Welcome section */}
        <section className="mechanic-welcome">

          <h1>
            HELLO
            <br />
            {mechanicName}!
          </h1>

          <p>
            Ready for roadside assistance calls across Batticaloa.
            High vehicle density detected along A4
            <br />
            Coastal Corridor & Gate Bazaar.
          </p>

        </section>

        {/* Statistics cards */}
        <section className="mechanic-stat-grid">

          {/* Earnings */}
          <div className="mechanic-stat-card">

            <div className="stat-heading">
              TODAY'S EARNINGS

              <span className="stat-icon green">
                <CircleDollarSign size={19} />
              </span>
            </div>

            <h2>Rs. 18,500</h2>

            <p className="stat-positive">
              ↗ +12% <span>vs yesterday</span>
            </p>

            <div className="stat-bottom">
              <span>Target: Rs. 24,000</span>
              <span>77% met</span>
            </div>

          </div>

          {/* Jobs completed */}
          <div className="mechanic-stat-card">

            <div className="stat-heading">
              JOBS COMPLETED

              <span className="stat-icon blue">
                <CheckCircle2 size={19} />
              </span>
            </div>

            <h2>
              4 <small>/ 6 Target</small>
            </h2>

            <div className="target-progress">
              <span />
            </div>

            <p className="stat-description">
              2 more to daily milestone bonus
            </p>

          </div>

          {/* Active dispatch */}
          <div className="mechanic-stat-card active-job-card">

            <div className="stat-heading">
              ACTIVE DISPATCH
              <span className="active-dot" />
            </div>

            <h2>1 Live Job</h2>

            <p>
              <Clock3 size={13} />
              Awaiting Technician Arrival
            </p>

            <div className="dispatch-bottom">
              <span>Ticket: #RM-8492</span>
              <span>ETA: 6 mins</span>
            </div>

          </div>

          {/* Response time */}
          <div className="mechanic-stat-card">

            <div className="stat-heading">
              AVG RESPONSE TIME

              <span className="stat-icon blue">
                <Clock3 size={19} />
              </span>
            </div>

            <h2>14 mins</h2>

            <p className="stat-positive">
              ✧ Top 5% <span>Eastern Province</span>
            </p>

            <div className="stat-bottom">
              <span>Zone Avg: 26 mins</span>
              <span className="stat-positive">
                -12 mins faster
              </span>
            </div>

          </div>

        </section>

        {/* Main work area */}
        <section className="mechanic-work-area">

          <section className="dashboard-requests">
            <header className="dashboard-requests-heading">
              <div>
                <h3>Pending Service Requests</h3>
                <p>{requests.length} requests waiting for dispatch</p>
              </div>
              <Link to="/mechanic/requests">View all requests</Link>
            </header>

            {requestsLoading && (
              <p className="dashboard-requests-state" role="status">
                Loading pending requests...
              </p>
            )}
            {requestsError && (
              <p className="dashboard-requests-error" role="alert">
                {requestsError}
              </p>
            )}
            {!requestsLoading && !requestsError && requests.length === 0 && (
              <p className="dashboard-requests-state">
                There are no pending service requests.
              </p>
            )}

            {requests.slice(0, 3).map((request) => (
              <Link
                key={request._id}
                to="/mechanic/requests"
                state={{ selectedRequestId: request._id }}
                className="dashboard-request-card"
              >
                <div className="dashboard-request-card-heading">
                  <strong>Request #{request._id.slice(-6).toUpperCase()}</strong>
                  <time dateTime={request.createdAt}>
                    {new Date(request.createdAt).toLocaleString()}
                  </time>
                </div>
                <p>
                  {request.customer?.fullName || "Customer"} ·{" "}
                  {request.vehicle?.model || request.vehicle?.vehicleType || "Vehicle"}
                  {request.vehicle?.registrationNumber
                    ? ` (${request.vehicle.registrationNumber})`
                    : ""}
                </p>
                <p>{request.problem}</p>
                <span>
                  <MapPin size={13} />
                  {request.location?.address || "Location not provided"}
                </span>
              </Link>
            ))}
          </section>
        </section>

      </main>

    </div>
  );
}

export default MechanicDashboard;