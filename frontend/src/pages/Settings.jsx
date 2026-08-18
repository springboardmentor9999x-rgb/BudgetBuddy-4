import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaCheck, FaChevronRight, FaLock, FaPalette, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { getProfile } from "../services/profileService";
import "./Settings.css";

const defaults = {
  currency: "INR", theme: "system", compact: false, emailUpdates: true,
  weeklySummary: true, budgetAlerts: true, showBalances: true,
};

function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [accountName, setAccountName] = useState("Personal account");

  useEffect(() => {
    const stored = localStorage.getItem("budgetbuddy-settings");
    if (stored) {
      try { setSettings({ ...defaults, ...JSON.parse(stored) }); } catch { localStorage.removeItem("budgetbuddy-settings"); }
    }
  }, []);

  useEffect(() => { getProfile().then((profile) => setAccountName(profile.full_name || "Personal account")).catch(() => undefined); }, []);

  const update = (key, value) => { setSaved(false); setSettings((current) => ({ ...current, [key]: value })); };
  const save = () => {
    localStorage.setItem("budgetbuddy-settings", JSON.stringify(settings));
    // Persist theme for instant application across the app
    if (settings.theme && settings.theme !== 'system') {
      localStorage.setItem('budgetbuddy-theme', settings.theme);
      document.documentElement.setAttribute('data-theme', settings.theme === 'dark' ? 'dark' : 'light');
    } else {
      localStorage.removeItem('budgetbuddy-theme');
      document.documentElement.setAttribute('data-theme', (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
    }
    setSaved(true);
  };
  const logout = () => { localStorage.removeItem("token"); navigate("/login", { replace: true }); };

  return <div className="settings-page">
    <header className="settings-heading">
      <div>
        <p>Personalize your workspace</p>
        <h1>Settings</h1>
        <span>Manage how BudgetBuddy works for you.</span>
      </div>
      <button className="settings-save" onClick={save}><FaCheck /> Save changes</button>
    </header>
    {saved && <div className="settings-notice"><FaCheck /> Your preferences have been saved on this device.</div>}

    <div className="settings-grid">
      <section className="settings-section profile-section">
        <div className="settings-section-title"><span className="settings-section-icon"><FaUserCog /></span><div><h2>Account</h2><p>Review account access and security.</p></div></div>
        <div className="settings-panel">
          <div className="account-row"><div className="settings-avatar">{accountName.trim().charAt(0).toUpperCase()}</div><div><strong>{accountName}</strong><p>Your profile details are managed securely.</p></div><span className="account-secure">Secure</span></div>
          <div className="settings-account-summary">
            <div><span>Account type</span><strong>Personal</strong></div>
            <div><span>Access</span><strong>Full access</strong></div>
          </div>
          <Link className="settings-link-row" to="/profile"><span><FaLock /> Edit profile</span><FaChevronRight /></Link>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><span className="settings-section-icon"><FaPalette /></span><div><h2>Appearance</h2><p>Choose how financial data is displayed.</p></div></div>
        <div className="settings-panel settings-controls">
          <label>Currency<select value={settings.currency} onChange={(e) => update("currency", e.target.value)}><option value="INR">Indian rupee (INR)</option><option value="USD">US dollar (USD)</option><option value="EUR">Euro (EUR)</option></select></label>
          <label>Appearance<select value={settings.theme} onChange={(e) => update("theme", e.target.value)}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label className="settings-toggle"><input type="checkbox" checked={settings.compact} onChange={(e) => update("compact", e.target.checked)} /><span><strong>Compact transaction tables</strong><small>Show more records in less space.</small></span></label>
          <label className="settings-toggle"><input type="checkbox" checked={settings.showBalances} onChange={(e) => update("showBalances", e.target.checked)} /><span><strong>Show balances on dashboard</strong><small>Keep summary totals visible after sign in.</small></span></label>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><span className="settings-section-icon"><FaBell /></span><div><h2>Notifications</h2><p>Decide what reaches your inbox.</p></div></div>
        <div className="settings-panel settings-controls">
          <label className="settings-toggle"><input type="checkbox" checked={settings.emailUpdates} onChange={(e) => update("emailUpdates", e.target.checked)} /><span><strong>Account updates</strong><small>Important notices about your BudgetBuddy account.</small></span></label>
          <label className="settings-toggle"><input type="checkbox" checked={settings.weeklySummary} onChange={(e) => update("weeklySummary", e.target.checked)} /><span><strong>Weekly financial summary</strong><small>A weekly view of income and spending.</small></span></label>
          <label className="settings-toggle"><input type="checkbox" checked={settings.budgetAlerts} onChange={(e) => update("budgetAlerts", e.target.checked)} /><span><strong>Budget alerts</strong><small>Be notified when spending approaches a budget limit.</small></span></label>
        </div>
      </section>

      <section className="settings-section danger-zone">
        <div className="settings-section-title"><span className="settings-section-icon danger-icon"><FaSignOutAlt /></span><div><h2>Session</h2><p>Sign out safely from this browser.</p></div></div>
        <div className="settings-panel danger-panel"><p>Your financial records remain unchanged.</p><button className="settings-logout" onClick={logout}><FaSignOutAlt /> Log out</button></div>
      </section>
    </div>
  </div>;
}

export default Settings;
