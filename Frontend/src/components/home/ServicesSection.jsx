
import {
  Wrench,
  BatteryCharging,
  Gauge,
  Fuel,
  Truck,
  Lightbulb,
} from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Puncture & Tyres",
    description:
      "Flat tire replacement, tubeless puncture plugging, portable pneumatic re-inflation, and wheel balance checking on spot.",
    label: "Starting from",
    price: "Rs. 1,500",
  },
  {
    icon: BatteryCharging,
    title: "Battery Jumpstart",
    description:
      "Emergency heavy-duty jumpstart service, terminal oxide cleaning, voltage diagnostics, and on-spot replacement if needed.",
    label: "Starting from",
    price: "Rs. 2,000",
  },
  {
    icon: Gauge,
    title: "Engine Breakdown",
    description:
      "Radiator overheating diagnosis, coolant leaks, broken fan belt repairs, and rapid mechanical troubleshooting roadside.",
    label: "Starting from",
    price: "Rs. 3,500",
  },
  {
    icon: Fuel,
    title: "Emergency Fuel Delivery",
    description:
      "Emergency delivery of up to 5 liters of verified Petrol or Diesel straight to your stranded location in certified safety canisters.",
    label: "Fuel cost + delivery",
    price: "Rs. 1,200",
  },
  {
    icon: Truck,
    title: "Flatbed & Tow Truck",
    description:
      "Safe hydraulic tilt-tray flatbed recovery for damaged vehicles, transferring to certified garage facilities or your chosen destination.",
    label: "Base charge",
    price: "Rs. 5,000",
  },
  {
    icon: Lightbulb,
    title: "Electrical & Ignition",
    description:
      "Blown fuse replacement, alternator checks, starter motor relay testing, and emergency lighting repairs under rain or night conditions.",
    label: "Starting from",
    price: "Rs. 2,500",
  },
];

function ServicesSection() {
  return (
    <section className="services-section" id="services">
      <div className="services-heading">
        <div>
          <span className="section-badge">Services</span>
          
          <h2>Comprehensive breakdown assistance</h2>
        </div>
         <br/>
        <p className="services-intro">
          Round-the-clock rapid roadside interventions covering
          motorbikes, three-wheelers, cars, and utility commercial
          vehicles across Batticaloa.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <article className="service-card" key={service.title}>
              <div className="service-icon">
                <Icon size={17} />
              </div>

              <h3>{service.title}</h3>
              <p>{service.description}</p>

              <div className="service-price">
                <span>{service.label}</span>
                <strong>{service.price}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ServicesSection;