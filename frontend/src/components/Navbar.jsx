import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaCrown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try { await logout(); } finally { navigate("/"); }
    };

    const isAdmin = user?.role === "admin";
    const isPro = !isAdmin && user?.account_tier === "premium";

    const toggleSidebar = () => {
        window.dispatchEvent(new Event("bb:toggle-sidebar"));
    };

    return (
        <header className="bb-navbar">
            <button type="button" className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Open navigation">☰</button>
            <div className="bb-navbar-inner">
                <div className="bb-navbar-welcome">
                    <span className="bb-navbar-dot" />
                    <span>Welcome back,</span>
                    <strong>{user?.full_name || "User"}</strong>
                    {user?.is_verified && (
                        <span className="bb-verified-badge" title="Email verified">
                            <FaCheckCircle /> Verified
                        </span>
                    )}
                </div>

                <div className="bb-navbar-actions">
                    <span className={`bb-tier-badge ${isAdmin ? "admin" : isPro ? "pro" : "normal"}`}>
                        {isAdmin ? "ADMIN" : isPro ? <><FaCrown /> PRO</> : "NORMAL"}
                    </span>

                    <NotificationBell />

                    <button type="button" className="bb-navbar-profile-button" onClick={() => navigate("/profile")}>
                        <span className="bb-user-avatar"><FaUserCircle /></span>
                        <span className="bb-user-details">
                            <span className="bb-user-name">{user?.full_name || "User"}</span>
                            <span className="bb-user-role">
                                {isAdmin ? "Administrator" : isPro ? "Pro Account" : "Personal Account"}
                            </span>
                        </span>
                    </button>

                    <button type="button" className="bb-navbar-logout" onClick={handleLogout} title="Sign out">
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
