
import { Navigation, Star, BadgeCheck, MapPin } from "lucide-react";

function NearbyMechanics() {
  return (
    <section className="dashboard-card small-dashboard-card mechanic-card">
      <div className="small-card-heading mechanic-heading">
        <span className="small-card-icon"><Navigation size={15} /></span>
        <h3>Nearby Mechanics</h3>
        <span className="mechanics-active">● 7 Active in 3km</span>
      </div>

      <div className="mechanic-details">
        <div className="mechanic-title-row">
          <strong>Mike's Roadside Service</strong>
          <span className="status-pill">● Available</span>
        </div>

        <div className="mechanic-rating">
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <strong>4.9</strong>
          <span>(128 reviews)</span>
          <BadgeCheck size={12} color="#285cff" />
        </div>

        <p className="mechanic-distance">
          <MapPin size={12} /> 1.4 km away
        </p>

        <div className="mechanic-tags">
          <span>RoadMate Certified</span>
          <span>Flatbed & Wheel Lift</span>
        </div>

        <button
          type="button"
          className="dispatch-button"
          onClick={() => alert("Mechanic dispatch will be added later.")}
        >
          <Navigation size={13} />
          Request Dispatch
        </button>
      </div>

      <button
        type="button"
        className="mechanic-more-button"
        aria-label="View more mechanics"
        onClick={() => alert("More mechanics will be added later.")}
      >
        →
      </button>
    </section>
  );
}

export default NearbyMechanics;
