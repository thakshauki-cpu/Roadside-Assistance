import { CarFront, UserRound, Menu } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

function HomeHeader() {
  const navigate = useNavigate();

  return (
    <header className="home-header">
      <a href="/"  className="brand">
          <img
          src="/src/assets/logo.png"
          alt="Roadmate"
          className="logo"
          />
        
     
      </a>

      <nav className="header-nav">
        <a className="active" href="#home">Home</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="header-actions">
      
          <button className="login-btn"
           onClick={() => navigate("/login")}>Login</button>
        
        <button className="register-btn" onClick={() => navigate("/register")}>Register</button>
        <button className="profile-btn" aria-label="Profile">
          <UserRound size={18} />
        </button>
      </div>

      <button className="mobile-menu" aria-label="Open menu">
        <Menu size={25} />
      </button>
    </header>
  );
}

export default HomeHeader;
