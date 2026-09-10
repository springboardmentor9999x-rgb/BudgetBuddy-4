import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../../utils/notifications";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getAdminDashboardStats, getSystemAnalytics } from "../../services/adminService";

const CARDS = [
  ["total_users", "Total Users", "👥"],
  ["active_users", "Active Users", "🟢"],
  ["verified_users", "Verified", "✓"],
  ["pro_users", "Premium Users", "👑"],
  ["new_registrations_last_7_days", "New · 7 days", "↗"],
  ["admin_users", "Administrators", "🛡"],
  ["total_login_events", "Logins recorded", "↪"],
  ["total_logout_events", "Sign-outs recorded", "↩"],
];

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminDashboardStats(), getSystemAnalytics()]).then(([a,b]) => { setStats(a); setSystem(b); }).catch(() => toast.error("Failed to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return <>
    <Sidebar /><Navbar /><ToastContainer />
    <main className="bb-admin-page">
      <div className="bb-admin-hero">
        <div><span>CONTROL CENTER</span><h1>Admin Operations</h1><p>Monitor users, verification, account tiers and platform activity.</p></div>
        <div className="bb-admin-hero-mark">🛡️</div>
      </div>
      {loading ? <LoadingSpinner /> : stats && <>
        <section className="bb-admin-grid">
          {CARDS.map(([key,label,icon]) => <article className="bb-admin-stat" key={key}><span>{icon}</span><strong>{stats[key] ?? 0}</strong><small>{label}</small></article>)}
        </section>
        <section className="bb-admin-finance-grid">
          <article><span>SYSTEM ANALYTICS · TRANSACTIONS</span><strong>{system?.total_transactions ?? 0}</strong><p>Total income + expense records across the platform.</p></article>
          <article><span>SYSTEM ANALYTICS · NORMAL USERS</span><strong>{system?.normal_users ?? 0}</strong><p>Customer accounts on the Normal plan.</p></article>
          <article><span>SYSTEM ANALYTICS · PREMIUM USERS</span><strong>{system?.premium_users ?? 0}</strong><p>Customer accounts with Premium access.</p></article>
          <article><span>SYSTEM ANALYTICS · REGISTRATIONS</span><strong>{stats.new_registrations_last_7_days ?? 0}</strong><p>New registrations during the last 7 days.</p></article>
        </section>
      </>}
    </main>
  </>;
}
export default AdminDashboard;
