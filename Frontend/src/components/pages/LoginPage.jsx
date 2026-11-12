
import { useState } from "react";
import {
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  Gauge,
  MapPin,
} from "lucide-react";

import "../styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const loginData = {
        email: email.trim(),
        password,
      };

      // 1. First check Admin login
      const adminResponse = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const adminData = await adminResponse.json();

      if (adminResponse.ok) {
        // Admin login successful
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        const storage = rememberDevice ? localStorage : sessionStorage;

        storage.setItem("adminToken", adminData.token);
        storage.setItem("adminUser", JSON.stringify(adminData.admin));

        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // If Admin credentials are invalid, check Customer / Mechanic.
      // Other Admin errors (e.g. inactive account) should be shown.
      if (adminResponse.status !== 401) {
        throw new Error(adminData.message || "Admin login failed.");
      }

      // 2. Check Customer login
      const customerResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...loginData,
          role: "customer",
        }),
      });

      const customerData = await customerResponse.json();

      if (customerResponse.ok) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        const storage = rememberDevice ? localStorage : sessionStorage;

        storage.setItem("token", customerData.token);
        storage.setItem("user", JSON.stringify(customerData.user));

        navigate("/dashboard", { replace: true });
        return;
      }

      // A 401 means customer credentials/role did not match.
      // A 403 means the account is blocked or has another restriction.
      if (customerResponse.status !== 401) {
        throw new Error(
          customerData.message || "Customer login failed."
        );
      }

      // 3. Check Mechanic login
      const mechanicResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...loginData,
          role: "mechanic",
        }),
      });

      const mechanicData = await mechanicResponse.json();

      if (mechanicResponse.ok) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        const storage = rememberDevice ? localStorage : sessionStorage;

        storage.setItem("token", mechanicData.token);
        storage.setItem("user", JSON.stringify(mechanicData.user));

        navigate("/mechanic/dashboard", { replace: true });
        return;
      }

      throw new Error(
        mechanicData.message || "Invalid email or password."
      );
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-label-row">
            <label htmlFor="login-identity">Email</label>
          </div>

          <div className="login-input-wrapper">
            <Phone size={16} />
            <input
              id="login-identity"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) =>
                  setRememberDevice(event.target.checked)
                }
              />
              <span>Remember device</span>
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="create-account-text">
          Don't have an account?{" "}
          <Link to="/register">Register as Customer</Link>
          {" or "}
          <Link to="/mechanic-register">Register as Mechanic</Link>
        </div>

        <div className="emergency-card">
          <div className="emergency-icon">
            <Gauge size={17} />
          </div>

          <div className="emergency-content">
            <h2>24/7 Batticaloa Emergency Line</h2>
            <p>
              Critical breakdown? Call direct:{" "}
              <a href="tel:1990">1990</a> or{" "}
              <a href="tel:0652222400">065-222-2400</a>
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
