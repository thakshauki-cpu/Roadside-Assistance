import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Search, Building2, MapPin, Phone, Clock, Eye, ShieldCheck, CreditCard } from "lucide-react";
import AdminLayout from "../components/Admin/AdminLayout";
import { pendingApplications, getInitials } from "../adminSampleData/adminSampleData";

function AdminVerification() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");

  // Only the Pending tab has sample data
  const visibleApplications =
    tab === "pending"
      ? pendingApplications.filter((item) => {
          const text = (item.name + item.garage + item.phone).toLowerCase();
          return text.includes(search.toLowerCase());
        })
      : [];

  return (
    <AdminLayout activeItem="Verification Requests">
      <div className="adm-title-row">
        <div>
          <h1 className="adm-title">
            Verification Requests <span className="adm-badge orange">● 5 Action Required</span>
          </h1>
          <p className="adm-subtitle">
            Review and verify National Identity Card (NIC), NVQ mechanical certifications, and workshop trade licenses
            for roadside assistance technicians across Batticaloa and Eastern Province.
          </p>
        </div>
        <button type="button" className="adm-btn" onClick={() => alert("Bulk verify will work after the backend is connected.")}>
          <ListChecks size={16} /> Bulk Verify (5)
        </button>
      </div>

      <div className="adm-card adm-toolbar column">
        <div className="adm-toolbar-top">
          <div className="adm-tabs">
            <button type="button" className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
              Pending <span className="adm-count orange">5</span>
            </button>
            <button type="button" className={tab === "approved" ? "active" : ""} onClick={() => setTab("approved")}>
              Approved <span className="adm-count">142</span>
            </button>
            <button type="button" className={tab === "rejected" ? "active" : ""} onClick={() => setTab("rejected")}>
              Rejected / Incomplete <span className="adm-count">12</span>
            </button>
          </div>
          <span className="adm-grey-text">5 applications awaiting dispatch review</span>
        </div>

        <div className="adm-search wide">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search mechanic name, workshop name, or phone number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Application cards */}
      {visibleApplications.map((item) => (
        <section key={item.id} className="adm-card adm-app-card">
          <span className="adm-avatar photo">{getInitials(item.name)}</span>

          <div className="adm-app-info">
            <div className="adm-app-name">
              <h3>{item.name}</h3>
              <span className="adm-badge blue">{item.tag}</span>
              <span className="adm-badge orange">● Pending Review</span>
            </div>

            <p className="adm-app-line">
              <span><Building2 size={13} /> {item.garage}</span>
              <span><MapPin size={13} /> {item.place}</span>
              <span className="adm-blue-text"><Phone size={13} /> {item.phone}</span>
            </p>

            <div>
              {item.chips.map((chip) => (
                <span key={chip} className="adm-mini-chip">
                  <CreditCard size={11} /> {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="adm-app-right">
            <small>
              <Clock size={12} /> {item.submitted}
            </small>
            <div>
              <button type="button" className="adm-btn-light" onClick={() => alert("Document viewer will be built later.")}>
                <Eye size={15} /> View Docs
              </button>
              <button type="button" className="adm-btn" onClick={() => navigate("/admin/verification/review")}>
                <ShieldCheck size={15} /> Review &amp; Verify
              </button>
            </div>
          </div>
        </section>
      ))}

      {visibleApplications.length === 0 && (
        <p className="adm-card adm-empty">No applications to show in this list (sample data is only added for Pending).</p>
      )}

      <div className="adm-card adm-pagination solo">
        <span>
          Showing <b>1</b> to <b>{visibleApplications.length}</b> of <b>5</b> pending verification requests
        </span>
        <div className="adm-pages">
          <button type="button" className="active">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminVerification;