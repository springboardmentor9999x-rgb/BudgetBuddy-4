import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    FaHome, FaMoneyBillWave, FaWallet, FaChartPie, FaChartBar,
    FaUser, FaCog, FaSignOutAlt, FaUserShield, FaPiggyBank,
    FaUniversity, FaHistory, FaCheckCircle, FaCrown, FaBars, FaAngleDoubleLeft
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../utils/useAppSettings";
import { t } from "../utils/i18n";

const COLLAPSED_WIDTH = "76px";

function Sidebar() {
    const navigate = useNavigate();
    const { logout, isAdmin, user } = useAuth();
    useAppSettings();
    const [mobileOpen, setMobileOpen] = useState(false);

    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem("bb:sidebar-collapsed") === "1"
    );

    useEffect(() => {
        // Drives every page's layout via the single --bb-sidebar-width CSS
        // variable that final.css/global.css already use for margin-left
        // and width calc() everywhere - so this doesn't need to touch any
        // stylesheet's cascade, just override the variable's value.
        const root = document.documentElement;
        if (collapsed) {
            root.style.setProperty("--bb-sidebar-width", COLLAPSED_WIDTH);
        } else {
            root.style.removeProperty("--bb-sidebar-width");
        }
        localStorage.setItem("bb:sidebar-collapsed", collapsed ? "1" : "0");
    }, [collapsed]);

    useEffect(() => {
        // Never leave the desktop content area collapsed-width on a phone -
        // mobile already uses the drawer (mobileOpen) instead.
        return () => {
            document.documentElement.style.removeProperty("--bb-sidebar-width");
        };
    }, []);

    useEffect(() => {
        const toggle = () => setMobileOpen((value) => !value);
        const close = () => setMobileOpen(false);
        window.addEventListener("bb:toggle-sidebar", toggle);
        window.addEventListener("bb:close-sidebar", close);
        return () => {
            window.removeEventListener("bb:toggle-sidebar", toggle);
            window.removeEventListener("bb:close-sidebar", close);
        };
    }, []);

    const handleLogout = async (e) => {
        e.preventDefault();
        try { await logout(); } finally { navigate("/"); }
    };

    const navItems = [
        ["/dashboard", "Dashboard", <FaHome />],
        ["/bank-accounts", "Bank Accounts", <FaUniversity />],
        ["/income", "Income", <FaMoneyBillWave />],
        ["/expense", "Expense", <FaWallet />],
        ["/budget", "Budget", <FaChartPie />],
        ["/savings-goal", "Savings Goals", <FaPiggyBank />],
        ["/transaction-history", "Transaction History", <FaHistory />],
        ["/reports", "Reports", <FaChartBar />],
        ["/settings", "Settings", <FaCog />],
        ["/profile", "Profile", <FaUser />],
    ];

    const isPro = !isAdmin && user?.account_tier === "premium";

    return (
        <>
            {mobileOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
            <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""} ${collapsed ? "sidebar-collapsed" : ""}`}>
            <button
                type="button"
                className="sidebar-collapse-toggle"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <FaBars /> : <FaAngleDoubleLeft />}
            </button>
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">₹</div>
                <div className="sidebar-brand-text">
                    <div className="sidebar-logo">BudgetBuddy</div>
                    <div className="sidebar-subtitle">PERSONAL FINANCE OS</div>
                </div>
            </div>

            <div className="sidebar-account-card">
                <div className="sidebar-account-top">
                    <span className={`sidebar-tier-dot ${isAdmin ? "admin" : isPro ? "pro" : ""}`}>
                        {isAdmin ? <FaUserShield /> : isPro ? <FaCrown /> : <FaUser />}
                    </span>
                    <div>
                        <strong>{isAdmin ? "Administrator" : isPro ? "Pro workspace" : "Personal workspace"}</strong>
                        <small>{user?.email || "Signed-in account"}</small>
                    </div>
                </div>
                <div className="sidebar-account-status">
                    <span><FaCheckCircle /> {user?.is_verified ? "Email verified" : "Verification pending"}</span>
                    <span><FaCheckCircle /> Budget tracking ready</span>
                    <span><FaCheckCircle /> Savings tracking ready</span>
                </div>
            </div>

            <div className="sidebar-section-title">{t("MAIN MENU")}</div>
            <nav className="sidebar-navigation">
                {navItems.map(([path, label, icon]) => (
                    <NavLink key={path} to={path} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                        <span className="sidebar-link-icon">{icon}</span>
                        <span className="sidebar-link-text">{t(label)}</span>
                    </NavLink>
                ))}

                {isAdmin && (
                    <>
                        <div className="sidebar-divider" />
                        <div className="sidebar-section-title admin-title">{t("ADMIN CONTROL")}</div>
                        <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <span className="sidebar-link-icon"><FaUserShield /></span><span className="sidebar-link-text">Admin Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <span className="sidebar-link-icon"><FaUserShield /></span><span className="sidebar-link-text">Manage Users</span>
                        </NavLink>
                        <NavLink to="/admin/premium-requests" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <span className="sidebar-link-icon"><FaCrown /></span><span className="sidebar-link-text">Premium Requests</span>
                        </NavLink>
                        <NavLink to="/admin/activity-logs" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <span className="sidebar-link-icon"><FaHistory /></span><span className="sidebar-link-text">Activity Logs</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-bottom">
                <button type="button" className="sidebar-logout" onClick={handleLogout}>
                    <span className="sidebar-link-icon"><FaSignOutAlt /></span>
                    <span className="sidebar-link-text">Sign out</span>
                </button>
            </div>
        </aside>
        </> 
    );
}
export default Sidebar;
