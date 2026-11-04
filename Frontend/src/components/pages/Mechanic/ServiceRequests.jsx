import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";
import {
  getMechanicProfile,
  getPendingServiceRequests,
  updateMechanicAvailability,
} from "../../../api/mechanic";

import "../../styles/Mechanic/MechanicDashboard.css";
import "../../styles/Mechanic/ServiceRequests.css";

function ServiceRequests() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(
    location.state?.selectedRequestId || null
  );

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

  const selectedRequest =
    requests.find((request) => request._id === selectedRequestId) || requests[0];
  const customer = selectedRequest?.customer;
  const vehicle = selectedRequest?.vehicle;

  return (
    <div className="service-requests-page">
      <MechanicSidebar
        activeItem="Requests"
        pendingCount={requests.length}
        isAvailable={profile?.isAvailable}
        availabilityLoading={availabilityLoading}
        availabilityUpdating={availabilityUpdating}
        availabilityError={availabilityError}
        onToggleAvailability={
          profile ? handleToggleAvailability : undefined
        }
      />

      <main className="service-main">
        <MechanicTopbar mechanicName={profile?.user?.fullName || "Mechanic"} />

        <div className="service-content">
          <div className="service-title">
            <h1>Service Requests</h1>
            <p>Pending customer requests for roadside assistance.</p>
          </div>

          {requestsLoading && (
            <p className="service-requests-state" role="status">
              Loading service requests...
            </p>
          )}
          {requestsError && (
            <p className="service-requests-error" role="alert">
              {requestsError}
            </p>
          )}
          {!requestsLoading && !requestsError && requests.length === 0 && (
            <p className="service-requests-state">
              There are no pending service requests.
            </p>
          )}

          {!requestsLoading && !requestsError && requests.length > 0 && (
            <div className="service-grid">
              <section className="request-list" aria-label="Pending requests">
                {requests.map((request) => (
                  <button
                    key={request._id}
                    type="button"
                    className={`service-request-card pending-request ${
                      request._id === selectedRequestId ? "selected-request" : ""
                    }`}
                    onClick={() => setSelectedRequestId(request._id)}
                  >
                    <div className="request-header">
                      <div>
                        <strong className="request-id">
                          Request #{request._id.slice(-6).toUpperCase()}
                        </strong>
                        <span className="pending-label">PENDING</span>
                        <p>{new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <h3>{request.problem}</h3>
                    <div className="vehicle-number">
                      <strong>
                        {request.vehicle?.registrationNumber || "Registration not provided"}
                      </strong>
                      <span>
                        {request.vehicle?.model || request.vehicle?.vehicleType || "Vehicle"}
                      </span>
                    </div>
                    <div className="problem-box">
                      <p>
                        <AlertTriangle size={14} />
                        {request.description || request.problem}
                      </p>
                      <p>
                        <Navigation size={14} />
                        {request.location?.address || "Location not provided"}
                      </p>
                    </div>
                    <span className="request-customer">
                      Customer: {request.customer?.fullName || "Unavailable"}
                    </span>
                  </button>
                ))}
              </section>

              {selectedRequest && (
                <section className="incoming-dispatch" aria-label="Selected request details">
                  <div className="dispatch-header">
                    <span className="incoming-label">PENDING REQUEST</span>
                    <h2>{selectedRequest.problem}</h2>
                    <p>
                      Submitted {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="dispatch-content">
                    <div className="customer-card">
                      <div className="customer-avatar">
                        {(customer?.fullName || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="customer-info">
                        <strong>{customer?.fullName || "Customer"}</strong>
                        <span>{customer?.mobile || "Phone number unavailable"}</span>
                        <small>Customer</small>
                      </div>
                      {customer?.mobile && (
                        <a
                          href={`tel:${customer.mobile.replace(/[^\d+]/g, "")}`}
                          className="customer-call"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                      )}
                    </div>

                    <div className="dispatch-information">
                      <div className="information-box">
                        <span>VEHICLE</span>
                        <strong>
                          {vehicle?.model || vehicle?.vehicleType || "Not provided"}
                        </strong>
                        <small>
                          {vehicle?.registrationNumber || "Registration not provided"}
                        </small>
                      </div>
                      <div className="information-box">
                        <span>REQUEST STATUS</span>
                        <strong>{selectedRequest.status}</strong>
                        <small>
                          {vehicle?.vehicleType || "Vehicle type not provided"}
                        </small>
                      </div>
                    </div>

                    <div className="selected-request-location">
                      <strong>
                        <MapPin size={14} />
                        Location
                      </strong>
                      <span>{selectedRequest.location?.address || "Not provided"}</span>
                      {selectedRequest.location?.landmark && (
                        <small>Landmark: {selectedRequest.location.landmark}</small>
                      )}
                    </div>

                    {selectedRequest.description && (
                      <p className="selected-request-description">
                        {selectedRequest.description}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ServiceRequests;
