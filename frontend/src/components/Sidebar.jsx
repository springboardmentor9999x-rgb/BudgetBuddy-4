import { useEffect, useState } from "react";
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
  FaCrown,
  FaUserShield,
  FaUsers,
  FaUser,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import api from "../api/axios";

function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const [account,setAccount]=useState(null);
  useEffect(()=>{const load=()=>api.get("/auth/me").then(response=>setAccount(response.data)).catch(()=>undefined);load();window.addEventListener("budgetbuddy:membership-updated",load);return()=>window.removeEventListener("budgetbuddy:membership-updated",load);},[]);
  const userMenuItems = [
    { path: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
    { path: "/budget", icon: <FaBullseye />, label: "Budget" },
    { path: "/analytics", icon: <FaChartPie />, label: "Analytics" },
    { path: "/premium", icon: <FaCrown />, label: "Upgrade to Premium" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
  ];
  const adminMenuItems = [
    { path: "/admin", icon: <FaUserShield />, label: "Admin Dashboard", end: true },
    { path: "/admin/users", icon: <FaUsers />, label: "User Management" },
    { path: "/admin/system-analytics", icon: <FaChartBar />, label: "System Analytics" },
    { path: "/admin/system-management", icon: <FaCog />, label: "System Management" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
  ];
  const premiumMenuItems = [
    { path: "/premium-dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
    { path: "/budget", icon: <FaBullseye />, label: "Budget" },
    { path: "/advanced-analytics", icon: <FaChartPie />, label: "Analytics" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports / Export" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
  ];
  const role = account?.role === "admin" ? "admin" : account?.role === "premium" ? "premium" : "user";
  const RoleIcon = role === "admin" ? FaUserShield : role === "premium" ? FaCrown : FaUser;
  const roleName = role === "admin" ? "Admin" : role === "premium" ? "Premium User" : "Free User";
  const rolePlan = role === "admin" ? "Administrator" : role === "premium" ? "Premium Plan" : "Free Plan";
  const menuItems = role === "admin" ? adminMenuItems : role === "premium" ? premiumMenuItems : userMenuItems;

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
            end={item.end}
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
        {account && <div className={`account-plan ${role}`}><i><RoleIcon/></i><span><strong>{roleName}</strong><small>{rolePlan}</small></span></div>}
        <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); navigate("/login", { replace: true }); }}>
          <FaSignOutAlt />
          <span style={{ marginLeft: "10px" }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
