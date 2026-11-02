
import { useState } from "react";
import {
  CarFront,
  LayoutDashboard,
  ClipboardList,
  Wallet,
  UserRound,
  Bell,
  Settings,
  LogOut,
  Search,
  MapPin,
  Headset,
  Star,
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  Phone,
  Navigation,
  ShieldAlert,
  Power,
} from "lucide-react";

import "../../styles/Mechanic/MechanicDashboard.css";

function MechanicDashboard() {
  // Store the mechanic's availability status locally for now.
  const [isAvailable, setIsAvailable] = useState(true);

  const mechanicName =
    JSON.parse(localStorage.getItem("user") || "{}").fullName ||
    "Mechanic";

  const handleAvailability = () => {
    // This changes the UI only. Backend integration will save this status later.
    setIsAvailable((previousStatus) => !previousStatus);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="mechanic-dashboard">
      {/* Sidebar */}
      <aside className="mechanic-sidebar">
        <div className="mechanic-brand">
          <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          
          />
        </div>

        <div className="mechanic-location">
          <MapPin size={13} />
          Batticaloa Sector
        </div>

        <nav className="mechanic-nav">
          <a href="/mechanic/dashboard" className="active">
            <LayoutDashboard size={17} />
            Dashboard
          </a>

          <a href="/mechanic/requests">
            <ClipboardList size={17} />
            Requests
            <span className="nav-count">3</span>
          </a>

          <a href="/mechanic/earnings">
            <Wallet size={17} />
            Earnings
          </a>

          <a href="/mechanic/profile">
            <UserRound size={17} />
            Profile
          </a>

          <a href="/mechanic/notifications">
            <Bell size={17} />
            Notifications
          </a>

          <a href="/mechanic/settings">
            <Settings size={17} />
            Settings
          </a>
        </nav>

        <div className="mechanic-sidebar-bottom">
          <div className="sidebar-duty">
            <span>Duty Status</span>
            <strong className={isAvailable ? "online" : "offline"}>
              <i />
              {isAvailable ? "ONLINE" : "OFFLINE"}
            </strong>
            <small>
              {isAvailable
                ? "Available for emergency jobs"
                : "Not accepting new jobs"}
            </small>
          </div>

          <button
            type="button"
            className="mechanic-logout"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="mechanic-main">
        {/* Topbar */}
        <header className="mechanic-topbar">
          <div className="mechanic-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search jobs, ticket ID, or +94 phone..."
            />
          </div>

          <div className="topbar-location">
            <MapPin size={13} />
            Kallady, Batticaloa
          </div>

          <div className="topbar-help">
            <Headset size={14} />
            Helpdesk: 065 222 4500
          </div>

          <button
            type="button"
            className="topbar-notification"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span>3</span>
          </button>

          <div className="topbar-profile">
            <div>
              <strong>{mechanicName}</strong>
              <small><Star size={11} fill="currentColor" /> 4.9 (142 jobs)</small>
            </div>
            <div className="profile-avatar">
              <UserRound size={20} />
            </div>
          </div>
        </header>

        {/* Welcome section */}
        <section className="mechanic-welcome">
          <h1>
            HELLO
            <br />
            {mechanicName}!
          </h1>
          <p>
            Ready for roadside assistance calls across Batticaloa.
            High vehicle density detected along A4 Coastal Corridor & Gate Bazaar.
          </p>
        </section>

        {/* Dashboard summary cards */}
        <section className="mechanic-stat-grid">
          <div className="mechanic-stat-card">
            <div className="stat-heading">
              TODAY'S EARNINGS
              <span className="stat-icon green">
                <CircleDollarSign size={20} />
              </span>
            </div>
            <h2>Rs. 18,500</h2>
            <p className="stat-positive">↗ +12% <span>vs yesterday</span></p>
            <div className="stat-bottom">
              <span>Target: Rs. 24,000</span>
              <span>77% met</span>
            </div>
          </div>

          <div className="mechanic-stat-card">
            <div className="stat-heading">
              JOBS COMPLETED
              <span className="stat-icon blue">
                <CheckCircle2 size={20} />
              </span>
            </div>
            <h2>4 <small>/ 6 Target</small></h2>
            <div className="target-progress">
              <span />
            </div>
            <p className="stat-description">2 more to daily milestone bonus</p>
          </div>

          <div className="mechanic-stat-card active-job-card">
            <div className="stat-heading">
              ACTIVE DISPATCH
              <span className="active-dot" />
            </div>
            <h2>1 Live Job</h2>
            <p><Clock3 size={13} /> Awaiting Technician Arrival</p>
            <div className="dispatch-bottom">
              <span>Ticket: #RM-8492</span>
              <span>ETA: 6 mins</span>
            </div>
          </div>

          <div className="mechanic-stat-card">
            <div className="stat-heading">
              AVG RESPONSE TIME
              <span className="stat-icon blue">
                <Clock3 size={20} />
              </span>
            </div>
            <h2>14 mins</h2>
            <p className="stat-positive">♧ Top 5% <span>Eastern Province</span></p>
            <div className="stat-bottom">
              <span>Zone Avg: 26 mins</span>
              <span className="stat-positive">-12 mins faster</span>
            </div>
          </div>
        </section>

        {/* Main dashboard area */}
        <section className="mechanic-work-area">
          <div className="urgent-dispatch-card">
            <div className="urgent-heading">
              <div className="urgent-alert">
                <ShieldAlert size={19} />
              </div>

              <div>
                <h3>Urgent Live Dispatch</h3>
                <p>Ticket #RM-8492 • Broadcasted 4 mins ago</p>
              </div>

              <span className="priority-label">● HIGH PRIORITY</span>
              <strong className="dispatch-fee">Rs. 4,200 <small>est. fee</small></strong>
            </div>

            <div className="customer-details">
              <div>
                <small>MOTORIST DETAILS</small>
                <h4>Niroshan Perera</h4>
                <strong>077 892 4110</strong>
                <p>Vehicle: Honda Grace (Hybrid) · WP CAA 4821</p>
              </div>

              <div>
                <small>FAILURE DIAGNOSTICS</small>
                <h4 className="failure-text">Alternator Failure / Battery Dead</h4>
                <p><MapPin size={13} /> Gate Bazaar Junction, Near Clock Tower</p>
                <p>Distance: 1.8 km · Est. Travel Time: 6 mins</p>
              </div>
            </div>

            <div className="dispatch-map-placeholder">
              <span>Map preview will appear here</span>
            </div>

            <div className="dispatch-actions">
              <button type="button" className="navigate-button">
                <Navigation size={14} />
                Navigate with Maps (6m)
              </button>

              <button type="button" className="call-button">
                <Phone size={14} />
                Call Customer
              </button>

              <button type="button" className="arrived-button">
                Update to Arrived
              </button>
            </div>
          </div>

          {/* Availability card replaces Emergency Province Support */}
          <aside className="mechanic-availability-card">
            <div className="availability-card-heading">
              <Power size={18} />
              <span>MECHANIC DUTY STATUS</span>
            </div>

            <h2>
              {isAvailable ? "You are Available" : "You are Unavailable"}
            </h2>

            <p>
              {isAvailable
                ? "Customers can find your profile and send you service requests."
                : "Customers will not see you as an available mechanic."}
            </p>

            <div className={`availability-status ${isAvailable ? "status-online" : "status-offline"}`}>
              <span />
              {isAvailable ? "AVAILABLE FOR JOBS" : "NOT AVAILABLE"}
            </div>

            <button
              type="button"
              className={`availability-toggle ${isAvailable ? "toggle-on" : "toggle-off"}`}
              onClick={handleAvailability}
            >
              <span className="toggle-circle" />
              {isAvailable ? "Go Unavailable" : "Go Available"}
            </button>

            <small className="availability-note">
              You can change your duty status anytime.
            </small>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default MechanicDashboard;