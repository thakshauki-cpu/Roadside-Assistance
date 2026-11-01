
import {
  ArrowRight,
  BellRing,
  CheckCircle,
  Clock,
  Fuel,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldCheck,
  Star,
  Wrench,
  History,
  Truck,
  Sparkles,
  CircleHelp,
} from "lucide-react";

import "./Welcome.css";

import { useNavigate } from "react-router-dom";

function WelcomeSection() {

    // localStorage keeps data as text, so JSON.parse turns it back into an object
  const user = JSON.parse(localStorage.getItem("user"));

  // fullName is "John Doe", split(" ") makes ["John", "Doe"], [0] takes "John"
  // If no user is saved, firstName is an empty text
  const firstName = user ? user.fullName.split(" ")[0] : "";

   const navigate = useNavigate();
  return (
    <section className="welcome-dashboard">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <b>
          Welcome,
          <br /><br/>
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
              <br/>
              Roadside assistance
            <br/>
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
              src="src/assets/front map.PNG"
              alt="Vehicle roadside assistance"
            />
          </div>
        </section>

        {/* Vehicle card */}
        <section className="vehicle-card">
          <div className="vehicle-card-heading">
            <div className="vehicle-title">
              <h3>Your Vehicle</h3>
              <span className="primary-badge">Primary</span>
            </div>

            <button
              type="button"
              className="switch-vehicle-button"
            >
              ↔ Switch
            </button>
          </div>

          <div className="vehicle-details">
            <div>
              <h4>Toyota Corolla</h4>
              <h4>Altis</h4>
              <p>1.8 VLT Petrol • Royal Blue</p>
            </div>

            <div className="vehicle-plate">
              <span className="plate-country">IND</span>
              <span>TN 07 AB<br />1234</span>
            </div>
          </div>
{/* 
          <div className="vehicle-image">
            <img
              src="/src/assets/Car.PNG"
              alt="Blue car"
            />

            <span className="vehicle-status">
              <CheckCircle size={11} />
              Connected OBD-II Active
            </span>
          </div> */}

          <div className="vehicle-info-strip">
            <div>
              <span>Fuel Type</span>
              <strong>
                <Fuel size={12} />
                Petrol (91)
              </strong>
            </div>

            <div>
              <span>Last Serviced</span>
              <strong>28 Feb 2025</strong>
            </div>

            <div>
              <span>Insurance</span>
              <strong className="insurance-active">
                <CheckCircle size={12} />
                Dec 2025
              </strong>
            </div>
          </div>
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

            <button type="button" className="text-action">
              History
            </button>
          </div>

          <div className="request-details-box">
            <div className="request-title-row">
              <h4>
                Tyre Puncture
                <br />
                Repair
              </h4>
              <span className="completed-badge">
                ● Completed
              </span>
            </div>

            <p className="request-date">
              12 Apr 2025 · 03:45 PM
            </p>

            <div className="request-mechanic">
              <ShieldCheck size={13} />
              <strong>Karthik Service Hub</strong>
            </div>

            <div className="request-rating">
              <span>You rated this service</span>
              <div aria-label="5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={13}
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="invoice-button"
          >
            View Invoice &amp; Inspection Report
            <ArrowRight size={14} />
          </button>
        </section>

        {/* Nearby mechanics */}
        <section className="dashboard-card nearby-mechanics-card">
          <div className="dashboard-card-heading">
            <div className="dashboard-heading-title">
              <span className="dashboard-heading-icon">
                <Navigation size={16} />
              </span>
              <h3>
                Nearby
             
                Mechanics
              </h3>
            </div>

            <span className="active-mechanics-count">
              ● 7 Active in 3km
            </span>
          </div>

          <div className="mechanic-details-box">
            <div className="mechanic-name-row">
              <h4>Mike's Roadside Service</h4>
              <span className="available-badge">
                ● Available
              </span>
            </div>

            <div className="mechanic-rating">
              <Star size={13} fill="currentColor" />
              <strong>4.9</strong>
              <span>(128 reviews)</span>
            </div>

            <div className="mechanic-distance">
              <MapPin size={13} />
              <span>1.4 km away</span>
            </div>

            <div className="mechanic-tags">
              <span>RoadMate Certified</span>
              <span>Flatbed &amp; Wheel Lift</span>
            </div>

            <button
              type="button"
              className="dispatch-button"
            >
              <PhoneCall size={14} />
              Request Dispatch
            </button>
          </div>

          <button
            type="button"
            className="view-mechanics-button"
            aria-label="View more mechanics"
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

            <button type="button" className="text-action">
              Mark all read
            </button>
          </div>

          <div className="alert-item">
            <span className="alert-icon alert-success">
              <CheckCircle size={15} />
            </span>

            <div className="alert-content">
              <h4>Mechanic Arrived Safely</h4>
              <p>
                Karthik completed your tyre inspection.
              </p>
              <span>2 hours ago</span>
            </div>
          </div>

          <div className="alert-item">
            <span className="alert-icon alert-service">
              <Wrench size={15} />
            </span>

            <div className="alert-content">
              <h4>Service Request Confirmed</h4>
              <p>Flatbed towing booked #RM-8921</p>
              <span>12 Apr, 03:20 PM</span>
            </div>
          </div>

          <div className="road-advice">
            <span>
              Need road advice?
            </span>

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
