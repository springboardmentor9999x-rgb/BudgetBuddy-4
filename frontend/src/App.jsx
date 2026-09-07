import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import Profile from "./pages/Profile";
import Goals from "./pages/Goals";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Premium from "./pages/Premium";
import AccessRoute from "./routers/AccessRoute";
import SystemAnalytics from "./pages/SystemAnalytics";
import SystemManagement from "./pages/SystemManagement";
import UserManagement from "./pages/UserManagement";
import PremiumDashboard from "./pages/PremiumDashboard";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routers/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/premium-dashboard" element={<AccessRoute type="premium"><PremiumDashboard /></AccessRoute>} />
        <Route path="/income" element={<Income />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/admin" element={<AccessRoute type="admin"><Admin /></AccessRoute>} />
        <Route path="/admin/users" element={<AccessRoute type="admin"><UserManagement /></AccessRoute>} />
        <Route path="/advanced-analytics" element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/system-analytics" element={<AccessRoute type="admin"><SystemAnalytics /></AccessRoute>} />
        <Route path="/admin/system-management" element={<AccessRoute type="admin"><SystemManagement /></AccessRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/goals" element={<Goals />} />
      </Route>
    </Routes>
  );
}

export default App;
