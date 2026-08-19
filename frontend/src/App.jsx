import { Routes, Route, Navigate } from "react-router-dom";

// =========================================================
// Authentication Pages
// =========================================================

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";

// =========================================================
// Main Application Pages
// =========================================================

import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budget from "./pages/Budget";
import SavingsGoals from "./pages/SavingsGoals";
import BankAccounts from "./pages/BankAccounts";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

// =========================================================
// Protected Route
// =========================================================

import ProtectedRoute from "./routes/ProtectedRoute";


function App() {
  return (
    <Routes>

      {/* =================================================
          DEFAULT
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* =================================================
          AUTHENTICATION
      ================================================= */}

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =================================================
          DASHBOARD
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          INCOME
      ================================================= */}

      <Route
        path="/income"
        element={
          <ProtectedRoute>
            <Income />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          EXPENSES
      ================================================= */}

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Expense />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          BUDGETS
      ================================================= */}

      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <Budget />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          SAVINGS GOALS
      ================================================= */}

      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <SavingsGoals />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          BANK ACCOUNTS
      ================================================= */}

      <Route
        path="/bank-accounts"
        element={
          <ProtectedRoute>
            <BankAccounts />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          ANALYTICS
      ================================================= */}

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          REPORTS
      ================================================= */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          NOTIFICATIONS
      ================================================= */}

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          SETTINGS
      ================================================= */}

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          INVALID URL
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;