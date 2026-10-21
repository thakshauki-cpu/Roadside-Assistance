
import { ArrowRight, BatteryCharging, Truck, Fuel, Wrench } from "lucide-react";

const services = [
  { name: "Flat Tyre", icon: Wrench },
  { name: "Battery Jumpstart", icon: BatteryCharging },
  { name: "Towing", icon: Truck },
  { name: "Fuel Delivery", icon: Fuel },
];

function AssistanceBanner() {
  return (
    <section className="assistance-banner">
      <div className="assistance-banner-content">
        <h2>
          Get Help –
          <br />
          Roadside assistance
          <br />
          when you need it
        </h2>

        <button
          type="button"
          className="assistance-help-button"
          onClick={() => alert("Assistance request form will be added later.")}
        >
          <span>Get Help<br />Now</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="assistance-banner-visual">
        <img
          src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=700&q=80"
          alt="Vehicle roadside assistance"
        />
      </div>

      <div className="assistance-service-list">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <button
              type="button"
              key={service.name}
              onClick={() => alert(`${service.name} selected.`)}
            >
              <Icon size={12} />
              <span>{service.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default AssistanceBanner;
