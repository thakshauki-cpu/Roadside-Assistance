import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Store,
  CalendarDays,
  Wrench,
  MapPin,
  LockKeyhole,
  Eye,
  EyeOff,
  UserPlus,
  CarFront,
} from "lucide-react";

import { registerUser } from "../../../api/auth.js";

import "../../styles/Mechanic/MechanicRegister.css";

const availableServices = [
  "Tyre Repair",
  "Battery Jumpstart",
  "Engine Breakdown",
  "Fuel Delivery",
  "Towing",
  "General Repair",
];

function MechanicRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    businessName: "",
    experience: "",
    services: [],
    address: "",
    longitude: "",
    latitude: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleServiceChange = (service) => {
    setFormData((previous) => ({
      ...previous,
      services: previous.services.includes(service)
        ? previous.services.filter((item) => item !== service)
        : [...previous.services, service],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the Terms of Service and Safety Policy.");
      return;
    }

    if (formData.services.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const longitude = Number(formData.longitude);
    const latitude = Number(formData.latitude);

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setError("Please enter valid longitude and latitude values.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        role: "mechanic",

        businessName: formData.businessName.trim(),
        experience: Number(formData.experience),
        services: formData.services,

        address: formData.address.trim(),
        longitude,
        latitude,
      });

      alert("Mechanic registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Mechanic registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mechanic-register-page">
      <header className="mechanic-register-header">
        <Link to="/" className="mechanic-register-brand">
          <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          className="logo"
         
        />
        </Link>

        <div className="mechanic-header-login">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </header>

      <main className="mechanic-register-container">
        <section className="mechanic-register-card">
          <div className="mechanic-form-heading">
            <span className="mechanic-form-badge">
              <Wrench size={15} />
              Mechanic Registration
            </span>

            <h1>Create Your Mechanic Account</h1>
            <p>
              Register your workshop and start receiving roadside
              assistance requests from customers.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Details */}
            <div className="mechanic-form-section">
              <h3>
                <UserRound size={19} />
                Personal Details
              </h3>

              <div className="mechanic-field">
                <label>Full Name *</label>
                <div className="mechanic-input-wrapper">
                  <UserRound size={17} />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mechanic-field">
                <label>Email Address *</label>
                <div className="mechanic-input-wrapper">
                  <Mail size={17} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mechanic-field">
                <label>Mobile Number *</label>
                <div className="mechanic-input-wrapper">
                  <Phone size={17} />
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="mechanic-form-section">
              <h3>
                <Store size={19} />
                Workshop / Business Details
              </h3>

              <div className="mechanic-field">
                <label>Workshop / Business Name *</label>
                <div className="mechanic-input-wrapper">
                  <Store size={17} />
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Enter your workshop name"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mechanic-field">
                <label>Years of Experience *</label>
                <div className="mechanic-input-wrapper">
                  <CalendarDays size={17} />
                  <input
                    type="number"
                    name="experience"
                    placeholder="Enter years of experience"
                    min="0"
                    max="70"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mechanic-form-section">
              <h3>
                <Wrench size={19} />
                Services Offered
              </h3>

              <p className="mechanic-section-description">
                Select the services you provide
              </p>

              <div className="mechanic-services-grid">
                {availableServices.map((service) => (
                  <label
                    className={`mechanic-service-option ${
                      formData.services.includes(service) ? "selected" : ""
                    }`}
                    key={service}
                  >
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => handleServiceChange(service)}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="mechanic-form-section">
              <h3>
                <MapPin size={19} />
                Location Details
              </h3>

              <div className="mechanic-field">
                <label>Workshop Address *</label>
                <div className="mechanic-input-wrapper">
                  <MapPin size={17} />
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* <div className="mechanic-coordinate-grid">
                <div className="mechanic-field">
                  <label>Longitude *</label>
                  <div className="mechanic-input-wrapper">
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      placeholder="e.g. 80.2707"
                      value={formData.longitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mechanic-field">
                  <label>Latitude *</label>
                  <div className="mechanic-input-wrapper">
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      placeholder="e.g. 13.0827"
                      value={formData.latitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div> */}

              <p className="mechanic-location-note">
                Enter your workshop's longitude and latitude coordinates.
              </p>
            </div>

            {/* Password */}
            <div className="mechanic-form-section">
              <h3>
                <LockKeyhole size={19} />
                Password
              </h3>

              <div className="mechanic-field">
                <label>Password *</label>
                <div className="mechanic-input-wrapper">
                  <LockKeyhole size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="mechanic-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="mechanic-field">
                <label>Confirm Password *</label>
                <div className="mechanic-input-wrapper">
                  <LockKeyhole size={17} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="mechanic-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <label className="mechanic-terms">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>
                I agree to the <a href="/terms">Terms of Service</a> and{" "}
                <a href="/safety">Safety Policy</a>.
              </span>
            </label>

            {error && <p className="mechanic-register-error">{error}</p>}

            <button
              type="submit"
              className="mechanic-register-submit"
              disabled={loading}
            >
              <UserPlus size={18} />
              {loading ? "Registering..." : "Register as Mechanic"}
            </button>

            <p className="mechanic-register-bottom">
              Already registered? <Link to="/login">Login here</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default MechanicRegisterPage;