import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar user={user} />

        {/* Dashboard Body */}
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back, {user?.full_name || "User"} 👋
            </h1>

            <p className="text-gray-500 mt-2">
              Here's an overview of your finances.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              title="Current Balance"
              value="₹0"
            />

            <StatCard
              title="Monthly Income"
              value="₹0"
            />

            <StatCard
              title="Monthly Expenses"
              value="₹0"
            />

            <StatCard
              title="Savings"
              value="₹0"
            />
          </div>

          {/* User Information */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              Account Information
            </h2>

            <div className="space-y-3 text-gray-700">
              <p>
                <strong>ID:</strong> {user?.id}
              </p>

              <p>
                <strong>Name:</strong> {user?.full_name || "N/A"}
              </p>

              <p>
                <strong>Email:</strong> {user?.email}
              </p>

              <p>
                <strong>Role:</strong> {user?.role}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;