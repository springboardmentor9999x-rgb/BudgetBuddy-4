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
    { path: "/dashboard", icon: <FaHome />, label: "Overview" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/budget", icon: <FaBullseye />, label: "Budgets" },
    { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
    { path: "/analytics", icon: <FaChartPie />, label: "Analytics" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports / Export" },
    { path: "/settings", icon: <FaCog />, label: "Profile & Settings" },
  ];
  const premiumMenuItems = [
    { path: "/dashboard", icon: <FaHome />, label: "Overview" },
    { path: "/income", icon: <FaWallet />, label: "Income" },
    { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
    { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
    { path: "/budget", icon: <FaBullseye />, label: "Budgets" },
    { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
    { path: "/analytics", icon: <FaChartPie />, label: "Analytics" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports / Export" },
    { path: "/settings", icon: <FaCog />, label: "Profile & Settings" },
  ];
  const role = account?.role === "admin" ? "admin" : account?.role === "premium" ? "premium" : "user";
  const RoleIcon = role === "admin" ? FaUserShield : role === "premium" ? FaCrown : FaUser;
  const roleName = role === "admin" ? "Admin" : role === "premium" ? "Premium User" : "Free User";
  const rolePlan = role === "admin" ? "Administrator" : role === "premium" ? "Premium Plan" : "Free Plan";
  const adminMenuSections = [
    {
      label: "User Features",
      items: [
        { path: "/dashboard", icon: <FaHome />, label: "Overview" },
        { path: "/income", icon: <FaWallet />, label: "Income" },
        { path: "/expenses", icon: <FaMoneyBillWave />, label: "Expenses" },
        { path: "/accounts", icon: <FaUniversity />, label: "Accounts" },
        { path: "/budget", icon: <FaBullseye />, label: "Budgets" },
        { path: "/goals", icon: <FaPiggyBank />, label: "Savings Goals" },
        { path: "/analytics", icon: <FaChartPie />, label: "Analytics" },
        { path: "/reports", icon: <FaChartBar />, label: "Reports / Export" },
        { path: "/settings", icon: <FaCog />, label: "Profile & Settings" },
      ],
    },
    {
      label: "Admin Features",
      items: [
        { path: "/admin", icon: <FaUserShield />, label: "Admin", end: true },
      ],
    },
  ];
  const menuSections = role === "admin"
    ? adminMenuSections
    : [{ label: null, items: role === "premium" ? premiumMenuItems : userMenuItems }];

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
        {menuSections.map((section) => (
          <div className="sidebar-menu-section" key={section.label || "navigation"}>
            {section.label && <p className="sidebar-menu-label">{section.label}</p>}
            {section.items.map((item) => (
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
          </div>
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
