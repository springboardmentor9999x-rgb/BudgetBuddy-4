import "../styles/Topbar.css";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBell, FaSearch, FaSignOutAlt, FaUser, FaSun, FaMoon, FaCog } from "react-icons/fa";
import { getNotifications, markNotificationRead } from "../services/notificationService";

const notificationTitles = {
  budget_added: "Budget created", budget_updated: "Budget updated", budget_deleted: "Budget deleted", budget_alert: "Budget alert",
  expense_added: "Expense added", expense_updated: "Expense updated", expense_deleted: "Expense deleted",
  income_added: "Income added", income_updated: "Income updated", income_deleted: "Income deleted",
  goal_added: "Savings goal created", goal_updated: "Savings goal updated", goal_deleted: "Savings goal deleted",
  goal_contribution: "Goal contribution", goal_milestone: "Goal milestone", monthly_report: "Monthly report", profile_updated: "Profile updated",
};

const getNotificationTitle = (notification) => {
  if (notificationTitles[notification.type]) return notificationTitles[notification.type];
  if (notification.type === "transaction_added") return notification.message.startsWith("Income") ? "Income added" : "Expense added";
  if (notification.type === "transaction_deleted") return notification.message.startsWith("Income") ? "Income deleted" : "Expense deleted";
  return "BudgetBuddy update";
};

function Topbar() {
  const location = useLocation();
  const topbarActionsRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({ fullName: "Varshini", email: "", occupation: "Personal Account" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("budgetbuddy-profile") || "{}");
      setProfile((current) => ({ ...current, ...saved }));
    } catch { /* Use the default display profile. */ }
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    setOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!topbarActionsRef.current?.contains(event.target)) {
        setOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const markRead = async (notification) => {
    if (notification.is_read) return;
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch { /* The notification remains unread until the next successful fetch. */ }
  };

  const toggleNotifications = () => {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    setOpen(false);
    if (opening) getNotifications().then(setNotifications).catch(() => {});
  };

  const today = new Date();
  const date = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  // Theme handling (dark / light / system)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('budgetbuddy-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'system';
  });

  const applyTheme = (t) => {
    const root = document.documentElement;
    if (!t || t === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    applyTheme(theme === 'system' ? null : theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('budgetbuddy-theme', next);
    applyTheme(next);
  };

  return <header className="topbar">
    <div className="topbar-left"><h2>{greeting}, Varshini</h2><p>{date}</p></div>
    <div className="topbar-right" ref={topbarActionsRef}>
      <div className="search-box"><FaSearch /><input type="text" placeholder="Search..." /></div>
      <div className="notification-menu">
        <button className="icon-btn" onClick={toggleNotifications} aria-label="Notifications" aria-expanded={notificationsOpen}><FaBell />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>
        {notificationsOpen && <div className="notification-dropdown"><div className="notification-heading"><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "All caught up"}</span></div>{notifications.length ? <div className="notification-list">{notifications.map((notification) => {
          const unread = !notification.is_read;
          return <button key={notification.id} className={`notification-item ${unread ? "unread" : ""}`} onClick={() => markRead(notification)} aria-label={`${unread ? "Unread" : "Read"} notification: ${notification.message}`}>
            <span className="notification-status" aria-hidden="true" />
            <span className="notification-content">
              <span className="notification-title"><strong>{getNotificationTitle(notification)}</strong>{unread && <span className="notification-new">New</span>}</span>
              <span className="notification-message">{notification.message}</span>
            </span>
          </button>;
        })}</div> : <p className="notification-empty">No notifications yet.</p>}</div>}
      </div>
      <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
      </button>
      <div className="profile-menu"><button className="profile" onClick={() => { setOpen((current) => !current); setNotificationsOpen(false); }} aria-expanded={open}><div className="avatar">{profile.fullName?.trim().charAt(0).toUpperCase() || "V"}</div><div><strong>{profile.fullName || "Varshini"}</strong><p>Personal Account</p></div></button>{open && <div className="profile-dropdown"><div className="profile-dropdown-head"><div className="avatar small">{profile.fullName?.trim().charAt(0).toUpperCase() || "V"}</div><div><strong>{profile.fullName || "Varshini"}</strong><span>{profile.email || "Personal account"}</span></div></div><Link to="/profile" onClick={() => setOpen(false)}><FaUser /> Profile</Link><Link to="/settings" onClick={() => setOpen(false)}><FaCog /> Account settings</Link><Link to="/login" onClick={() => localStorage.removeItem("token")}><FaSignOutAlt /> Log out</Link></div>}</div>
    </div>
  </header>;
}

export default Topbar;
