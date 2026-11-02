import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import logo from "../../../assets/logo.png";
import { adminLogin } from "../../../api/admin";
import "../../styles/admin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await adminLogin({
        email: email.trim(),
        password,
      });

      // Save Admin token separately
      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("adminToken", data.token);
      storage.setItem("adminUser", JSON.stringify(data.admin));

      navigate("/admin/dashboard", { replace: true });

    } catch (err) {
      setError(err.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="adm-login-page">
      <section className="adm-login-card">
        <img src={logo} alt="RoadMate" className="adm-login-logo" />

        <h1>
          Admin Login <ShieldCheck size={18} color="#0a49d6" />
        </h1>

        <p className="adm-login-text">
          Authorized personnel only. Access restricted to verified
          Batticaloa operational staff.
        </p>

        <form onSubmit={handleLogin}>
          <div className="adm-label-row">
            <label htmlFor="adm-email">Admin Email</label>
            <small>EP-ID Domain</small>
          </div>

          <div className="adm-login-input">
            <Mail size={16} />

            <input
              id="adm-email"
              type="email"
              placeholder="admin@roadmate.lk"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="adm-label-row">
            <label htmlFor="adm-password">Password</label>
          </div>

          <div className="adm-login-input">
            <LockKeyhole size={16} />

            <input
              id="adm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Show or hide password"
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>

          <div className="adm-login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember this device
            </label>

            <a href="#forgot">Forgot password?</a>
          </div>

          {error && <p className="adm-error">{error}</p>}

          <button
            type="submit"
            className="adm-btn adm-btn-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In to Admin Console"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;