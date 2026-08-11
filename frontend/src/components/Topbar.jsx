import "../styles/Topbar.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCog, FaSearch, FaSignOutAlt, FaUser } from "react-icons/fa";

function Topbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "Varshini", email: "", occupation: "Personal Account" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("budgetbuddy-profile") || "{}");
      setProfile((current) => ({ ...current, ...saved }));
    } catch { /* Use the default display profile. */ }
  }, []);
  const today = new Date();

  const date = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hour = today.getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <header className="topbar">

      <div className="topbar-left">

        <h2>{greeting}, Varshini 👋</h2>

        <p>{date}</p>

      </div>

      <div className="topbar-right">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <button className="icon-btn">
          <FaBell />
        </button>

        <button className="icon-btn">
          <FaCog />
        </button>

        <div className="profile-menu">
          <button className="profile" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
            <div className="avatar">{profile.fullName?.trim().charAt(0).toUpperCase() || "V"}</div>
            <div><strong>{profile.fullName || "Varshini"}</strong><p>Personal Account</p></div>
          </button>
          {open && <div className="profile-dropdown">
            <div className="profile-dropdown-head"><div className="avatar small">{profile.fullName?.trim().charAt(0).toUpperCase() || "V"}</div><div><strong>{profile.fullName || "Varshini"}</strong><span>{profile.email || "Personal account"}</span></div></div>
            <Link to="/profile" onClick={() => setOpen(false)}><FaUser /> Profile</Link>
            <Link to="/settings" onClick={() => setOpen(false)}><FaCog /> Account settings</Link>
            <Link to="/login" onClick={() => localStorage.removeItem("token")}><FaSignOutAlt /> Log out</Link>
          </div>}
        </div>

      </div>

    </header>
  );
}

export default Topbar;
