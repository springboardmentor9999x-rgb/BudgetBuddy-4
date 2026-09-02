import {
  FaHome,
  FaWallet,
  FaMoneyBillWave,
  FaChartBar,
  FaChartPie,
  FaUniversity,
  FaPiggyBank,
  FaCog,
  FaSignOutAlt,
  FaBullseye,
  FaBell,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const menuItems = [
    { path: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
    { path: "/budget", icon: <FaBullseye />, label: "Budget" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports" },
    { path: "/analytics", icon: <FaChartPie />, label: "Analytics" },
    { path: "/notifications", icon: <FaBell />, label: "Notifications" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Primary navigation">
      <div className="sidebar-header">
        <div className="logo-circle">
          <FaWallet />
        </div>

        <div>
          <h2>BudgetBuddy</h2>
          <p>Personal Finance</p>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); navigate("/login", { replace: true }); }}>
          <FaSignOutAlt />
          <span style={{ marginLeft: "10px" }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
