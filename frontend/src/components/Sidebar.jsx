import {
  FaHome,
  FaWallet,
  FaMoneyBillWave,
  FaChartBar,
  FaUniversity,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  const menuItems = [
    { path: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/budget", icon: "🎯", label: "Budget" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <aside className="sidebar">
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
        <NavLink to="/login" className="logout-btn">
          <FaSignOutAlt />
          <span style={{ marginLeft: "10px" }}>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
