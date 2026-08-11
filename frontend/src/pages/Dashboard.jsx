import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import BarChartCard from "../components/charts/BarChartCard";
import PieChartCard from "../components/charts/PieChartCard";
import ProgressCards from "../components/ProgressCards";
import RecentTransactions from "../components/RecentTransactions";
import { getDashboard } from "../services/dashboardService";
import "../styles/Dashboard.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getDashboard().then(setDashboard).catch(() => setError("We could not load your financial summary. Please refresh the page.")); }, []);
  if (error) return <div className="dashboard-message error">{error}</div>;
  if (!dashboard) return <div className="dashboard-message">Loading your dashboard...</div>;
  const { summary } = dashboard;

  return <div className="dashboard">
    <header className="dashboard-heading"><div><h1>Dashboard</h1><p>Here is a simple overview of your finances.</p></div><div className="dashboard-balance-simple"><span>Current balance</span><strong>{money(summary.balance)}</strong></div></header>
    <section className="cards"><DashboardCard title="Total income" amount={money(summary.total_income)} color="green" /><DashboardCard title="Total expenses" amount={money(summary.total_expense)} color="red" /><DashboardCard title="Balance" amount={money(summary.balance)} color="blue" /><DashboardCard title="Savings" amount={money(summary.savings)} color="orange" /></section>
    <section className="charts-grid"><BarChartCard dashboard={dashboard} /><PieChartCard dashboard={dashboard} /></section>
    <section className="dashboard-lower"><ProgressCards /><RecentTransactions dashboard={dashboard} /></section>
  </div>;
}
export default Dashboard;
