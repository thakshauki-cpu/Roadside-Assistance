

import {
  Send,
  UsersRound,
  Zap,
  Star,
  ShieldCheck,
} from "lucide-react";

function HeroSection() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-content">
        <div className="location-badge">
          <span className="status-dot"></span>
          24/7 Roadside Assistance in Batticaloa
        </div>

        <h1>
         <b>Stuck on the road?</b> 
          <span>Get help fast.</span>
        </h1>

        <p className="hero-description">
          Find trusted mechanics near you in Batticaloa, anytime.
          Rapid rescue, honest rates in Sri Lankan Rupees, and
          verified municipal technicians ready to deploy.
        </p>

        <div className="hero-buttons">
          <button className="get-help-btn">
            <Send size={17} />
            Get Help
          </button>

          <button className="join-mechanic-btn">
            <UsersRound size={17} />
            Join as Mechanic
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <Zap size={19} />
            </div>
            <div>
              <strong>12 mins</strong>
              <small>Average response</small>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon star-icon">
              <Star size={19} fill="currentColor" />
            </div>
            <div>
              <strong>4.8 / 5</strong>
              <small>Rated service</small>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <strong>100% Verified</strong>
              <small>Local technicians</small>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-image-wrapper">
        <img
          src="/src/assets/roadside-assistance.png"
          alt="Mechanic helping a driver with a broken-down car"
          className="hero-image"
        />
      </div>
    </section>
  );
}

export default HeroSection;
