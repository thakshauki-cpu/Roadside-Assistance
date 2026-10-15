
import {
  MapPin,
  ReceiptText,
  Navigation,
  Crosshair,
  Banknote,
  Timer,
} from "lucide-react";

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-heading">
        <span className="section-badge">How It Works</span>
        <h2>Simple, swift roadside support</h2>
        <p>
          Get moving again in 3 easy steps without negotiation or delays.
        </p>
      </div>

      <div className="steps-grid">
        <article className="step-card">
          <div className="service-icon">
            <MapPin size={20} />
          </div>
          <span className="step-label">STEP 01</span>
          <h3>Share your location</h3>
          <p>
            Tap to auto-detect your exact coordinates or pick popular
            landmark zones including Kallady Bridge, Puliyantivu,
            or Navalady Causeway.
          </p>
          <div className="step-feature">
            <Crosshair size={12} />
            <span>One-tap GPS accuracy</span>
          </div>
        </article>

        <article className="step-card">
          <div className="service-icon">
            <ReceiptText size={20} />
          </div>
          <span className="step-label">STEP 02</span>
          <h3>Get a quotation</h3>
          <p>
            Review clear, itemized pricing in Sri Lankan Rupees
            (Rs.) upfront before you confirm. Zero surprises or
            inflated emergency surcharges.
          </p>
          <div className="step-feature">
            <Banknote size={12} />
            <span>Regulated local standard rates</span>
          </div>
        </article>

        <article className="step-card">
          <div className="service-icon">
            <Navigation size={20} />
          </div>
          <span className="step-label">STEP 03</span>
          <h3>Mechanic arrives</h3>
          <p>
            Track your verified local mechanic live on the map.
            Direct in-app status updates and phone contacts keep
            you completely in control.
          </p>
          <div className="step-feature">
            <Timer size={12} />
            <span>Real-time ETA tracking</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default HowItWorks;