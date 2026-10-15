
import {
  BadgeCheck,
  Gauge,
  HandCoins,
  Award,
  Timer,
  CircleCheck,
} from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Mechanics",
    description:
      "Every technician is vetted with Sri Lankan National Identity (NIC), certified trade licenses, and rigorous local background checks for peace of mind.",
    footerIcon: Award,
    footer: "Skill Authenticated & Insured",
  },
  {
    icon: Gauge,
    title: "Quick Response",
    description:
      "Average arrival time of 10 to 15 minutes within Batticaloa municipal limits, Kallady, Bar Road, and major connecting causeway corridors.",
    footerIcon: Timer,
    footer: "Algorithmic Proximity Dispatch",
  },
  {
    icon: HandCoins,
    title: "Fair Prices in Rs.",
    description:
      "Transparent standard tariffs in Sri Lankan Rupees. Digital quotes are locked before any repair work commences, eliminating roadside haggling.",
    footerIcon: CircleCheck,
    footer: "Digital Receipts & Fair Rates",
  },
];

function WhySection() {
  return (
    <section className="why-section" id="why-roadmate">
      <div className="why-heading">
        <span className="section-badge">Why RoadMate</span>

        <h2>Built specifically for Batticaloa</h2>

        <p>
          Designed to tackle the unique geography of lagoon causeways,
          coastal heat, and isolated stretches.
        </p>
      </div>

      <div className="why-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          const FooterIcon = feature.footerIcon;

          return (
            <article className="why-card" key={feature.title}>
              <div className="service-icon why-icon">
                <Icon size={17} />
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <div className="why-footer">
                <FooterIcon size={11} />
                <span>{feature.footer}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default WhySection;