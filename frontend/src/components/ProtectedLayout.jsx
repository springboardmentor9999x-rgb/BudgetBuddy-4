import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function ProtectedLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Permanent Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Right Side */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <Navbar user={user} />

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>

      </div>

    </div>
  );
}

export default ProtectedLayout;