import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { MonthProvider } from "../context/MonthContext";

import "../styles/DashboardLayout.css";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <MonthProvider><div className="dashboard-layout">

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">

        <Topbar onMenu={() => setSidebarOpen(true)} />

        <Outlet />

      </main>

    </div></MonthProvider>
  );
}

export default DashboardLayout;
