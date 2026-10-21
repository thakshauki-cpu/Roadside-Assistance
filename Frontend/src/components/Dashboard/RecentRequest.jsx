
import { History, ArrowRight, ShieldCheck } from "lucide-react";

function RecentRequest() {
  return (
    <section className="dashboard-card small-dashboard-card">
      <div className="small-card-heading">
        <span className="small-card-icon"><History size={15} /></span>
        <h3>Recent Request</h3>
        <button type="button" onClick={() => alert("Request history will be added later.")}>
          History ›
        </button>
      </div>

      <div className="recent-request-details">
        <div className="request-title-row">
          <strong>Tyre Puncture Repair</strong>
          <span className="status-pill">● Completed</span>
        </div>

        <p>12 Apr 2025 · 03:45 PM</p>

        <div className="request-provider">
          <ShieldCheck size={13} />
          <strong>Karthik Service Hub</strong>
        </div>

        <span className="request-dot">•</span>
      </div>

      <div className="request-rating">
        <span>You rated this service</span>
        <strong aria-label="5 out of 5 stars">★★★★★</strong>
      </div>

      <button
        type="button"
        className="invoice-button"
        onClick={() => alert("Invoice report will be added later.")}
      >
        View Invoice & Inspection Report <ArrowRight size={12} />
      </button>
    </section>
  );
}

export default RecentRequest;
