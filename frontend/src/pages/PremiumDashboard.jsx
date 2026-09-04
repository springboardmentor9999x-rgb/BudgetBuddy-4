import { FaCrown, FaFileExport, FaChartLine } from "react-icons/fa";
import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import "./PremiumDashboard.css";

export default function PremiumDashboard() {
  return <main className="premium-dashboard">
    <section className="premium-dashboard-banner">
      <div>
        <span><FaCrown /> PREMIUM WORKSPACE</span>
        <h1>Your complete financial command center</h1>
        <p>Track today's position, then use deeper analytics and export-ready reports to plan what comes next.</p>
      </div>
      <div className="premium-dashboard-actions">
        <Link to="/advanced-analytics"><FaChartLine /> Full analytics</Link>
        <Link to="/reports"><FaFileExport /> Reports & exports</Link>
      </div>
    </section>
    <Dashboard />
  </main>;
}
