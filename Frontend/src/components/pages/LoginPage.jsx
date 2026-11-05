import { loginUser } from "../../api/auth.js";
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
  ShieldCheck,
} from "lucide-react";

import "../styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin } from "../../api/admin.js";

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");     // error message to show
  const [loading, setLoading] = useState(false); // true while waiting for backend



  // const handleLogin = (event) => {
  //   event.preventDefault();

  //   if (!email.trim() || !password) {
  //     alert("Please enter your email/phone number and password.");
  //     return;
  //   }

  //   navigate("/dashboard");
  // };
  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(`Please enter your ${role === "admin" ? "admin " : ""}email and password.`);
      return;
    }

    try {
      setLoading(true);

      if (role === "admin") {
        const data = await adminLogin({ email: email.trim(), password });

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");
        const storage = rememberDevice ? localStorage : sessionStorage;
        storage.setItem("adminToken", data.token);
        storage.setItem("adminUser", JSON.stringify(data.admin));
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      const data = await loginUser({ email, password, role });

      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "mechanic") {
        navigate("/mechanic/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
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

          <button
            type="button"
            className={`role-button ${role === "admin" ? "selected" : ""}`}
            onClick={() => setRole("admin")}
            aria-pressed={role === "admin"}
          >
            <ShieldCheck size={14} />
            Admin
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-label-row">
            <label htmlFor="login-identity">
              {role === "admin" ? "Admin Email" : "Email"}
            </label>
          
          </div>

          <div className="login-input-wrapper">
            <Phone size={16} />
            <input
              id="login-identity"
              type="text"
              placeholder={role === "admin" ? "admin@roadmate.lk" : "driver@roadmate.lk"}
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
                onChange={(event) => setRememberDevice(event.target.checked)}
              />
              <span>Remember device</span>
            </label>

            {/* <a href="#forgot-password" className="forgot-link">
              Forgot password?
            </a> */}
          </div>

          

        {error && <p className="form-error">{error}</p>}

<button type="submit" className="login-submit-button" disabled={loading}>
  <LogIn size={16} />
  {loading ? "Logging in..." : "Login"}
</button>




        </form>

        <div className="create-account-text">
  {role === "admin" ? (
    "Admin access is managed by RoadMate."
  ) : (
    <>
      Don't have an account?{" "}
      {role === "customer" ? (
        <Link to="/register">Register as Customer</Link>
      ) : (
        <Link to="/mechanic-register">Register as Mechanic</Link>
      )}
    </>
  )}
</div>

        {/* <p className="create-account-text">
          New customer stranded on road?
          <Link to="/register">Create account</Link>
        </p> */}

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
