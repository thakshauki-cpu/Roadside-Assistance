import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  MapPin,
  Star,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";
import {
  getMechanicProfile,
  getPendingServiceRequests,
  acceptServiceRequest,
  rejectServiceRequest,
  updateMechanicAvailability,
  getMechanicReviews,
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
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [requestActionFeedback, setRequestActionFeedback] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

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

  useEffect(() => {
    let active = true;
    getMechanicReviews()
      .then((data) => {
        if (active) setReviewData(data);
      })
      .catch((error) => {
        if (active) setReviewsError(error.message);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
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

  const handleRequestAction = async (requestId, action) => {
    if (processingRequestId) {
      return;
    }

    setProcessingRequestId(requestId);
    setProcessingAction(action);
    setRequestActionFeedback(null);

    try {
      const result =
        action === "accept"
          ? await acceptServiceRequest(requestId)
          : await rejectServiceRequest(requestId);

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request._id !== requestId)
      );
      setRequestActionFeedback({
        type: "success",
        message: result.message,
      });
    } catch (error) {
      setRequestActionFeedback({
        type: "error",
        message: error.message || `Unable to ${action} this request.`,
      });
    } finally {
      setProcessingRequestId(null);
      setProcessingAction(null);
    }
  };

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
        <MechanicTopbar
          mechanicName={mechanicName}
          showNotifications={false}
        />

        {/* Welcome section */}
        <section className="mechanic-welcome">

          <h1>
            HELLO {mechanicName}!
          </h1>

          <p>
            Ready for roadside assistance calls across Batticaloa.
            {" "}High vehicle density detected along A4 Coastal Corridor &amp;
            Gate Bazaar.
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
            {requestActionFeedback && (
              <p
                className={`dashboard-request-feedback ${requestActionFeedback.type}`}
                role={requestActionFeedback.type === "error" ? "alert" : "status"}
              >
                {requestActionFeedback.message}
              </p>
            )}
            {!requestsLoading && !requestsError && requests.length === 0 && (
              <p className="dashboard-requests-state">
                There are no pending service requests.
              </p>
            )}

            {requests.slice(0, 3).map((request) => (
              <article
                key={request._id}
                className="dashboard-request-card"
              >
                <Link
                  to="/mechanic/requests"
                  state={{ selectedRequestId: request._id }}
                  className="dashboard-request-link"
                >
                  <div className="dashboard-request-card-heading">
                    <strong>Request #{request._id.slice(-6).toUpperCase()}</strong>
                    <span className="dashboard-request-status">PENDING</span>
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
                  <span className="dashboard-request-location">
                    <MapPin size={13} />
                    {request.location?.address || "Location not provided"}
                  </span>
                </Link>
                <div className="dashboard-request-actions">
                  <button
                    type="button"
                    className="dashboard-request-action accept"
                    disabled={processingRequestId !== null}
                    aria-busy={
                      processingRequestId === request._id &&
                      processingAction === "accept"
                    }
                    onClick={() => handleRequestAction(request._id, "accept")}
                  >
                    {processingRequestId === request._id &&
                    processingAction === "accept"
                      ? "Accepting..."
                      : "Accept"}
                  </button>
                  <button
                    type="button"
                    className="dashboard-request-action reject"
                    disabled={processingRequestId !== null}
                    aria-busy={
                      processingRequestId === request._id &&
                      processingAction === "reject"
                    }
                    onClick={() => handleRequestAction(request._id, "reject")}
                  >
                    {processingRequestId === request._id &&
                    processingAction === "reject"
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="mechanic-reviews">
          <header className="mechanic-reviews-heading">
            <div>
              <h2><Star size={18} /> Customer Reviews</h2>
              <p>Feedback for your completed service requests</p>
            </div>
            {!reviewsLoading && !reviewsError && (
              <div className="mechanic-review-stats">
                <strong><Star size={15} fill="currentColor" /> {reviewData?.stats?.averageRating ?? 0}</strong>
                <span>{reviewData?.stats?.totalReviews ?? 0} reviews</span>
              </div>
            )}
          </header>

          {reviewsLoading ? (
            <p role="status">Loading customer reviews...</p>
          ) : reviewsError ? (
            <p className="mechanic-reviews-error" role="alert">{reviewsError}</p>
          ) : reviewData?.reviews?.length ? (
            <div className="mechanic-review-list">
              {reviewData.reviews.map((review) => {
                const serviceRequest = review.serviceRequestId;
                const serviceDate = serviceRequest?.completedAt || serviceRequest?.createdAt;

                return (
                  <article key={review._id} className="mechanic-review-card">
                    <div className="mechanic-review-top">
                      <strong>{review.customerId?.fullName || "Customer"}</strong>
                      <span className="mechanic-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    <p>{review.comment}</p>
                    <small>
                      {serviceRequest?.problem || "Service request"}
                      {serviceRequest?.vehicle?.model ? ` · ${serviceRequest.vehicle.model}` : ""}
                      {serviceDate ? ` · ${new Date(serviceDate).toLocaleDateString()}` : ""}
                    </small>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>No customer reviews yet.</p>
          )}
        </section>

      </main>

    </div>
  );
}

export default MechanicDashboard;