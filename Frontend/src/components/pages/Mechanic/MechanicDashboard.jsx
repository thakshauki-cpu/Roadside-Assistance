import { useState } from "react";

import {
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  UserRound,
  MapPin,
  Navigation,
  Phone,
  Flag,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";

import "../../styles/Mechanic/MechanicDashboard.css";

function MechanicDashboard() {

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const mechanicName = user.fullName || "Mechanic";

  const [arrived, setArrived] = useState(false);

  return (
    <div className="mechanic-dashboard">

      {/* Reusable Sidebar */}
      <MechanicSidebar activeItem="Dashboard" />

      {/* Main section */}
      <main className="mechanic-main">

        {/* Reusable Topbar */}
        <MechanicTopbar />

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

          {/* Urgent dispatch */}
          <div className="urgent-dispatch-card">

            <div className="urgent-heading">

              <div className="urgent-alert">
                <ShieldAlert size={19} />
              </div>

              <div className="urgent-title">
                <h3>Urgent Live Dispatch</h3>

                <p>
                  Ticket #RM-8492 • Broadcasted 4 mins ago
                </p>
              </div>

              <span className="priority-label">
                ● HIGH PRIORITY
              </span>

              <strong className="dispatch-fee">
                Rs. 4,200
                <small> est. fee</small>
              </strong>

            </div>

            {/* Motorist and failure details */}
            <div className="customer-details">

              <div className="motorist-details">

                <small>MOTORIST DETAILS</small>

                <div className="motorist-info">
                  <span className="motorist-avatar">
                    <UserRound size={20} />
                  </span>

                  <div>
                    <h4>Niroshan Perera</h4>
                    <strong>077 892 4110</strong>
                  </div>
                </div>

                <p>
                  Vehicle: Honda Grace (Hybrid)
                  &nbsp; WP CAA 4821
                </p>

              </div>

              <div className="failure-details">

                <small>FAILURE DIAGNOSTICS</small>

                <h4>
                  <ShieldAlert size={13} />
                  Alternator Failure / Battery Dead
                </h4>

                <p>
                  <MapPin size={13} />
                  Gate Bazaar Junction, Near Clock Tower
                </p>

                <p>
                  Distance: 1.8 km
                  &nbsp; · &nbsp;
                  Est. Travel Time: <strong>6 mins</strong>
                </p>

              </div>

            </div>

            {/* Empty map area - intentionally left blank */}
            <div className="dispatch-map-placeholder">
            </div>

            {/* Action buttons */}
            <div className="dispatch-actions">

              <button
                type="button"
                className="navigate-button"
                onClick={() =>
                  window.open(
                    "https://www.google.com/maps/search/?api=1&query=Gate+Bazaar+Batticaloa",
                    "_blank"
                  )
                }
              >
                <Navigation size={14} />
                Navigate with Maps (6m)
              </button>

              <a
                href="tel:0778924110"
                className="call-button"
              >
                <Phone size={14} />
                Call Customer
              </a>

              <button
                type="button"
                className="arrived-button"
                onClick={() => setArrived(true)}
              >
                <Flag size={13} />
                {arrived ? "Arrived" : "Update to Arrived"}
              </button>

            </div>

          </div>

          {/* Priority support */}
          <aside className="priority-support-card">

            <div className="support-heading">
              <span className="support-indicator" />
              PRIORITY SUPPORT LINE
            </div>

            <h3>Eastern Province Support</h3>

            <p className="support-description">
              Emergency escalation for dangerous road
              conditions, accident obstructions, or towing
              escorts.
            </p>

            <div className="support-contact">

              <div>
                <span>
                  <ShieldAlert size={13} />
                  Police Patrol / Emergency
                </span>

                <strong>119</strong>
              </div>

              <div>
                <span>
                  <Phone size={13} />
                  Highway Assist
                  <br />
                  Batticaloa
                </span>

                <strong>065 222 2222</strong>
              </div>

            </div>

          </aside>

        </section>

      </main>

    </div>
  );
}

export default MechanicDashboard;