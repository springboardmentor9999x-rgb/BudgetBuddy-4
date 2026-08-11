import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/DashboardLayout.css";

function DashboardLayout() {
  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="main-content">

        <Topbar />

        <Outlet />

      </main>

    </div>
  );
}

export default DashboardLayout;