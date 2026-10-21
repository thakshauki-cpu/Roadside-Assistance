
import {
  Send,
  Phone,
  Clock3,
  Headset,
} from "lucide-react";

function CallToAction() {
  return (
    <section className="cta-section" id="contact">
      <div className="cta-content">
        <div className="cta-badge">
          <Headset size={11} />
          Emergency Dispatch Ready
        </div>

        <h2>Need help right now?</h2>

        <p className="cta-description">
          Our emergency roadside response team is active across
          Batticaloa 24 hours a day, 7 days a week. We deploy within
          minutes to get you moving safely.
        </p>

        <div className="cta-buttons">
          <a href="#home" className="cta-help-btn">
            <Send size={13} />
            Get Help
          </a>

          <a href="tel:+94650000000" className="cta-phone-btn">
            <Phone size={13} />
            <span>or call: +94 65 000 0000</span>
          </a>
        </div>

        <div className="cta-note">
          <Clock3 size={12} />
          <span>
            Average technician dispatch ETA in urban zone: 15 minutes
          </span>
        </div>
      </div>

      <div className="cta-image-wrapper">
        <img
          src="/src/assets/roadmate-handshake.png"
          alt="Handshake representing trust and roadside assistance"
          className="cta-image"
        />
      </div>
    </section>

  );
}

export default CallToAction;
