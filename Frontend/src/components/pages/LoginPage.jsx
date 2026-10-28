
import { useState } from "react";
import {
  CarFront,
  BriefcaseBusiness,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  Gauge,
  MapPin,
} from "lucide-react";

import "../styles/LoginPage.css";
import { Link } from "react-router-dom";

function LoginPage() {
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    if (!emailOrPhone.trim() || !password) {
      alert("Please enter your email/phone number and password.");
      return;
    }

    // Connect your backend authentication API here.
    alert(`Login form submitted for ${role === "customer" ? "Customer" : "Mechanic / Tow"}.`);
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-top-border" />

        <div className="login-brand">
            <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          className="logo"
         
        />
        </div>

        <div className="login-heading">
          <h1>Welcome Back</h1>
          <p>
            Sign in to request prompt roadside
            assistance across Batticaloa &amp; Eastern
            Province
          </p>
        </div>

        <div className="login-role-switch" role="group" aria-label="Choose account type">
          <button
            type="button"
            className={`role-button ${role === "customer" ? "selected" : ""}`}
            onClick={() => setRole("customer")}
            aria-pressed={role === "customer"}
          >
            <CarFront size={14} />
            Customer
          </button>

          <button
            type="button"
            className={`role-button ${role === "mechanic" ? "selected" : ""}`}
            onClick={() => setRole("mechanic")}
            aria-pressed={role === "mechanic"}
          >
            <BriefcaseBusiness size={14} />
            Mechanic / Tow
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-label-row">
            <label htmlFor="login-identity">
              Email or Phone Number
            </label>
            <span>+94 77 123 4567</span>
          </div>

          <div className="login-input-wrapper">
            <Phone size={16} />
            <input
              id="login-identity"
              type="text"
              placeholder="e.g. 077 459 2810 or driver@roadmate.lk"
              value={emailOrPhone}
              onChange={(event) => setEmailOrPhone(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label className="password-label" htmlFor="login-password">
            Password
          </label>
           

          <div className="login-input-wrapper password-input-wrapper">
            <LockKeyhole size={16} />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
          

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
              />
              <span>Remember device</span>
            </label>

            <a href="#forgot-password" className="forgot-link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-submit-button">
            <LogIn size={16} />
            Login
          </button>
        </form>

        <p className="create-account-text">
          New customer stranded on road?
          <Link to="/register">Create account</Link>
        </p>

        <div className="emergency-card">
          <div className="emergency-icon">
            <Gauge size={17} />
          </div>

          <div className="emergency-content">
            <h2>24/7 Batticaloa Emergency Line</h2>
            <p>
              Critical breakdown? Call direct: 1990 or
              065-222-2400
            </p>

            <div className="emergency-location">
              <MapPin size={13} />
              <span>
                Covers Batticaloa, Kattankudy, Valachchenai &amp; Eravur
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
