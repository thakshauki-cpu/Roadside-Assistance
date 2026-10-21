
import { ArrowLeftRight, Fuel, ShieldCheck, Gauge } from "lucide-react";

function VehicleCard() {
  return (
    <section className="dashboard-card vehicle-card">
      <div className="vehicle-card-heading">
        <h3>Your Vehicle <span className="status-pill">Primary</span></h3>

        <button
          type="button"
          className="switch-vehicle-button"
          onClick={() => alert("Vehicle switching will be added later.")}
        >
          <ArrowLeftRight size={12} />
          Switch
        </button>
      </div>

      <div className="vehicle-details">
        <div>
          <h4>Toyota Corolla Altis</h4>
          <p>1.8 VL AT Petrol • Royal Blue</p>
        </div>

        <div className="vehicle-number">
          <span>TN</span>
          <strong>TN 07 AB<br />1234</strong>
        </div>
      </div>

      <div className="vehicle-image-wrap">
        <img
          src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85"
          alt="Blue sedan car"
        />
        <span className="vehicle-connected">
          <span /> Connected OBD-II Active
        </span>
      </div>

      <div className="vehicle-stats">
        <div>
          <span>Fuel Type</span>
          <strong><Fuel size={11} /> Petrol (91)</strong>
        </div>

        <div>
          <span>Last Serviced</span>
          <strong>28 Feb 2025</strong>
        </div>

        <div>
          <span>Insurance</span>
          <strong className="insurance-active">
            <ShieldCheck size={11} /> Dec 2025
          </strong>
        </div>
      </div>
    </section>
  );
}

export default VehicleCard;
