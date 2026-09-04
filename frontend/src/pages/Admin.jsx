import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChartLine, FaCrown, FaCreditCard, FaUserCheck, FaUsers, FaUserPlus, FaWallet } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import { getAdminOverview, getPayments } from "../services/adminService";
import "./Admin.css";
import "./AdminEnhancements.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const PIE_COLORS = ["#64748b", "#6c4df6"];

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAdminOverview(), getPayments(), api.get("/admin/activity")])
      .then(([summary, transactions, events]) => { setOverview(summary); setPayments(transactions); setActivity(events.data); })
      .catch(requestError => setError(requestError.response?.status === 403 ? "Administrator access required." : "Could not load the admin dashboard."));
  }, []);

  if (error && !overview) return <div className="admin-denied"><FaUsers /><h1>Admin dashboard</h1><p>{error}</p></div>;
  if (!overview) return <div className="reports-message">Loading admin dashboard...</div>;

  const cards = [
    [FaUsers, "Total users", overview.total_users], [FaUserCheck, "Active users", overview.active_users],
    [FaUserPlus, "New users (30 days)", overview.new_users], [FaCrown, "Premium users", overview.premium_users],
    [FaChartLine, "Transactions", overview.total_transactions], [FaWallet, "System income", money(overview.system_income)],
    [FaCreditCard, "System expenses", money(overview.system_expenses)], [FaCreditCard, "Premium revenue", money(overview.premium_revenue)],
  ];

  return <main className="admin-page">
    <header><span>Administration overview</span><h1>Admin dashboard</h1><p>System-wide users, subscriptions, payments, and financial activity.</p></header>
    {error && <p className="admin-error">{error}</p>}
    <section className="admin-stats admin-dashboard-stats">{cards.map(([Icon, label, value]) => <article key={label}><Icon /><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-chart-grid">
      <article className="admin-users admin-chart"><h2>User growth</h2><ResponsiveContainer width="100%" height={260}><LineChart data={overview.user_growth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="users" stroke="#6c4df6" strokeWidth={3} /></LineChart></ResponsiveContainer></article>
      <article className="admin-users admin-chart"><h2>Free vs Premium</h2><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={overview.plan_distribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4}>{overview.plan_distribution.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></article>
      <article className="admin-users admin-chart admin-chart-wide"><h2>System transaction trends</h2><ResponsiveContainer width="100%" height={280}><BarChart data={overview.transaction_trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={money} /><Legend /><Bar dataKey="income" fill="#16a34a" radius={[6, 6, 0, 0]} /><Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></article>
    </section>
    <section className="admin-dashboard-grid">
      <article className="admin-users"><div className="admin-section-head"><h2>Recent payments</h2><Link to="/admin/system-management">Manage system <FaArrowRight /></Link></div><div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.slice(0, 5).length ? payments.slice(0, 5).map(payment => <tr key={payment.id}><td><strong>{payment.user_name}</strong><small>{payment.email}</small></td><td>{payment.currency} {payment.amount}</td><td>{payment.status}</td></tr>) : <tr><td colSpan="3">No payments yet.</td></tr>}</tbody></table></div></article>
      <article className="admin-users"><div className="admin-section-head"><h2>Recent activity</h2><Link to="/admin/users">Manage users <FaArrowRight /></Link></div><div className="admin-activity-list">{activity.slice(0, 6).length ? activity.slice(0, 6).map(event => <div key={event.id}><i /><span><strong>{event.user}</strong><small>{event.message}</small></span></div>) : <p>No activity yet.</p>}</div></article>
    </section>
  </main>;
}
