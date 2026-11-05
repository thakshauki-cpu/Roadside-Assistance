
import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Truck,
  GraduationCap,
  Award,
  CarFront,
  CheckCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import MechanicSidebar from "../../Mechanic/MechanicSidebar";
import MechanicTopbar from "../../Mechanic/Topbar";
import { getMechanicProfile } from "../../../api/mechanic";

import "../../styles/Mechanic/MechanicProfile.css";

function MechanicProfile() {
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMechanicProfile()
      .then(({ profile }) => {
        if (active) {
          if (!profile) {
            throw new Error("Mechanic profile data was not returned.");
          }
          setMechanic(profile);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError.message || "Unable to load your profile.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const fullName = mechanic?.user?.fullName?.trim();
  const businessName = mechanic?.businessName?.trim();
  const phone = mechanic?.phone?.trim() || mechanic?.user?.mobile?.trim();
  const email = mechanic?.user?.email?.trim();
  const address = mechanic?.location?.address?.trim();
  const coordinates = mechanic?.location?.coordinates;
  const hasExperience =
    mechanic?.experience !== null &&
    mechanic?.experience !== undefined &&
    mechanic?.experience !== "" &&
    Number.isFinite(Number(mechanic.experience));
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates[0] !== null &&
    coordinates[0] !== "" &&
    coordinates[1] !== null &&
    coordinates[1] !== "" &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]));
  const services = Array.isArray(mechanic?.services)
    ? mechanic.services.filter(
        (service) => typeof service === "string" && service.trim()
      ).map((service) => service.trim())
    : [];

  return (
    <div className="mechanic-profile-page">

      {/* Existing reusable Sidebar */}
      <MechanicSidebar
        activeItem="Profile"
        pendingCount={3}
      />

      <main className="profile-main">

        {/* Existing reusable Topbar */}
        <MechanicTopbar
          notificationCount={3}
          mechanicName={fullName || "Mechanic"}
          location={address || ""}
          showStats={false}
        />

        <div className="profile-content">

          {/* PAGE TITLE */}
          <div className="profile-page-heading">

            <h1>Mechanic Profile &amp; Service Vehicle</h1>

            <p>
              View your registered workshop and roadside assistance details.
            </p>
          </div>

          {loading && (
            <p className="mechanic-profile-message" role="status">
              Loading your profile...
            </p>
          )}

          {!loading && error && (
            <p className="mechanic-profile-message error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && mechanic && (
            <>
              {/* MECHANIC PERSONAL INFORMATION */}
              <section className="mechanic-personal-card">

            <div className="personal-top">

              {/* <div className="mechanic-photo-wrapper">
                <img
                  src=""
                  alt="Mechanic profile"
                  className="mechanic-photo"
                />

                <span className="photo-verified">
                  <CheckCircle size={16} />
                </span>
              </div> */}

              <div className="mechanic-personal-details">

                <div className="mechanic-name-row">
                  {fullName && <h2>{fullName}</h2>}
                </div>

                <div className="mechanic-badges">
                  {businessName && (
                    <span className="business-name">{businessName}</span>
                  )}
                  {hasExperience && (
                    <span className="experience-badge">
                      <Award size={12} />
                      {mechanic.experience}{" "}
                      {Number(mechanic.experience) === 1
                        ? "year of experience"
                        : "years of experience"}
                    </span>
                  )}
                </div>

                {services.length > 0 && (
                  <div className="mechanic-services">
                    <strong>Services offered</strong>
                    <div className="mechanic-service-list">
                      {services.map((service) => (
                        <span key={service}>
                          <Wrench size={12} />
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mechanic-location-row">
                  {address && (
                    <span>
                      <MapPin size={13} />
                      {address}
                    </span>
                  )}
                  {hasCoordinates && (
                    <span>
                      <MapPin size={13} />
                      Coordinates (lat, long): {coordinates[1]},{" "}
                      {coordinates[0]}
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* CONTACT INFORMATION */}
            <div className="mechanic-contact-grid">

              {phone && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <Phone size={16} />
                  </div>

                  <div>
                    <span>MOBILE NUMBER</span>
                    <strong>{phone}</strong>
                  </div>
                </div>
              )}

              {email && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <Mail size={16} />
                  </div>

                  <div>
                    <span>EMAIL ADDRESS</span>
                    <strong>{email}</strong>
                  </div>
                </div>
              )}

              {businessName && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <MapPin size={16} />
                  </div>

                  <div>
                    <span>WORKSHOP</span>
                    <strong>{businessName}</strong>
                  </div>
                </div>
              )}

            </div>
              </section>

              {/* LOWER PROFILE SECTIONS */}
              <div className="profile-lower-grid">

            {/* SERVICE VEHICLE */}
            <section className="profile-panel vehicle-panel">

              <div className="panel-heading">

                <div className="panel-title-icon vehicle-icon">
                  <Truck size={22} />
                </div>

                <div>
                  <h3>Assigned Service Vehicle</h3>
                  <p>
                    Classified Heavy Field Workshop &amp; Recovery Rig
                  </p>
                </div>

                <span className="active-field-badge">
                  ● Active Field Rig
                </span>

              </div>

              <div className="vehicle-designation-box">

                <div>
                  <span>VEHICLE DESIGNATION</span>
                  <h3>{mechanic.vehicleName}</h3>
                  <p>{mechanic.vehicleDescription}</p>
                </div>

                <div className="registration-number">
                  <span>Provincial Registration</span>
                  <strong>
                    <small>EP</small>
                    CAB 1234
                  </strong>
                </div>

              </div>

              <div className="vehicle-extra-grid">

                <div className="vehicle-extra-card">
                  <h4 className="inspection-title">
                    <ShieldCheck size={13} />
                    Roadworthiness &amp; Inspection
                  </h4>

                  <strong>{mechanic.inspection}</strong>

                  <p>{mechanic.inspectionDescription}</p>
                </div>

                <div className="vehicle-extra-card">
                  <h4 className="insurance-title">
                    <ShieldCheck size={13} />
                    Commercial Insurance
                  </h4>

                  <strong>{mechanic.insurance}</strong>

                  <p>{mechanic.insuranceDescription}</p>
                </div>

              </div>
            </section>

            {/* CERTIFICATIONS */}
            <section className="profile-panel certification-panel">

              <div className="panel-heading">

                <div className="panel-title-icon certificate-icon">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <h3>Certifications &amp; Licenses</h3>
                  <p>
                    Verified by Ministry of Skills &amp; Vocational Training
                  </p>
                </div>

              </div>

              <div className="certificate-card">

                <div className="certificate-top">
                  <strong>
                    <Award size={13} />
                    NVQ Level 4 Specialist
                  </strong>

                  <span>Active</span>
                </div>

                <h4>Automotive Mechanical &amp; Electrical</h4>

                <p>
                  Ceylon German Technical Training Institute (CGTTI /
                  German Tech Moratuwa) accredited license.
                </p>

                <small>
                  <CheckCircle size={12} />
                  Reg ID: CGTTI-AUTO-2016-0941
                </small>

              </div>

              <div className="certificate-card">

                <div className="certificate-top">
                  <strong>
                    <CarFront size={13} />
                    Driving Licensure (Class B &amp; C)
                  </strong>

                  <span>Certified</span>
                </div>

                <h4>Heavy Vehicle &amp; Light Motor Endorsement</h4>

                <p>
                  Department of Motor Traffic Sri Lanka (DMT Werahera).
                  Cleared for flatbed towing and mobile workshop units.
                </p>

                <small>
                  <CheckCircle size={12} />
                  Lic: B-7822910-K (Valid to 2030)
                </small>

              </div>

            </section>

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MechanicProfile;
