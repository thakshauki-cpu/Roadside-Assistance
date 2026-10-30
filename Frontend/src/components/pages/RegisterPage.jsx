
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LockKeyhole, Eye, EyeOff, LogIn } from "lucide-react";
import "../styles/Register.css";

import { registerUser } from "../../api/auth.js";



function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

const [confirmPassword, setConfirmPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);



  // const handleSubmit = (event) => {
  //   event.preventDefault();

  //   if (!agreed) {
  //     alert("Please agree to the Terms of Service and Safety Policy.");
  //     return;
  //   }

  //   if (password.length < 8) {
  //     alert("Password must contain at least 8 characters.");
  //     return;
  //   }

  //   // Frontend validation only.
  //   // Backend API integration will add.




  //   alert("Form validated! Backend registration is not connected yet.");
  // };


const handleSubmit = async (event) => {
  event.preventDefault();
  setError("");

  if (!agreed) {
    setError("Please agree to the Terms of Service and Safety Policy.");
    return;
  }

  if (password.length < 8) {
    setError("Password must contain at least 8 characters.");
    return;
  }

  // Check both password fields match
  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  try {
    setLoading(true);

    // This page is for customers, so role is "customer"
    await registerUser({ fullName, email, mobile, password, role: "customer" });

    alert("Account created successfully! Please login.");
    navigate("/login");
  } catch (err) {
    setError(err.message); // example: "User already exists with this email"
  } finally {
    setLoading(false);
  }
};




  return (
    <main className="register-page">
      <Link to="/" className="register-brand">
       <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          className="logo"
         
        />
      </Link> 

      <section className="register-card">
        <div className="register-heading">
          <div>
            
            <h1>Create Account</h1>
            <p>
              Get instant breakdown support, live GPS tracking, and transparent upfront pricing across Batticaloa.
            </p>
          </div>

          <span className="register-badge">Quick 60s Setup</span>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label htmlFor="fullName">FULL NAME</label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="email">EMAIL ADDRESS</label>
            <div className="register-input-wrap">
              <Mail size={14} />
              <input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="mobile">MOBILE NUMBER (FOR SMS TRACKING)</label>
            <input
              id="mobile"
              type="tel"
              placeholder="98765 43210"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              autoComplete="tel"
              required
            />
          </div>

          <div className="register-field">
            <div className="register-password-label">
              <label htmlFor="password">CREATE PASSWORD</label>
              <span>Min.8 characters</span>
            </div>

            <div className="register-input-wrap">
              <LockKeyhole size={14} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
               type="button"
                className="register-eye-button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
         <div className="register-field">
            <div className="register-password-label">
              <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
              <span>Min.8 characters</span>
            </div>

            <div className="register-input-wrap">
              <LockKeyhole size={14} />
              <input
                   id="confirmPassword"
                   type={showPassword ? "text" : "password"}
                   placeholder="Re-enter your password"
                   value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                   autoComplete="new-password"
                    minLength={8}
                   required
                  />

              <button
               type="button"
                className="register-eye-button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <label className="register-terms">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              &amp;{" "}
              <a href="/safety-policy" target="_blank" rel="noreferrer">
                Roadside Safety Policy 
              </a>.
            </span>
          </label>

          <div className="register-divider" />

        
         {error && <p className="form-error">{error}</p>}

               <button type="submit" className="register-submit" disabled={loading}>
                <LogIn size={15} />
                   {loading ? "Creating account..." : "Create Account"}
           </button>

          <p className="register-login-link">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default RegisterPage;
