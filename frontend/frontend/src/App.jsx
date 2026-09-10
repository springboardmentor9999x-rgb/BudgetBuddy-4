import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import BankAccounts from "./pages/BankAccounts";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budget from "./pages/Budget";
import SavingsGoal from "./pages/SavingsGoal";
import TransactionHistory from "./pages/TransactionHistory";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminPremiumRequests from "./pages/admin/AdminPremiumRequests";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import NotificationPopup from "./components/NotificationPopup";

import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/navbar.css";

function protectedPage(page) {
    return (
        <ProtectedRoute>
            {page}
        </ProtectedRoute>
    );
}

function layoutPage(page) {
    return (
        <ProtectedRoute>
            <Layout>{page}</Layout>
        </ProtectedRoute>
    );
}

function adminPage(page) {
    // Existing admin pages already contain their own Sidebar/Navbar shell.
    return (
        <ProtectedRoute requiredRole="admin">
            {page}
        </ProtectedRoute>
    );
}

function App() {
    return (
        <>
            <NotificationPopup />

            <Routes>
                {/* PUBLIC */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/*
                  Dashboard and these pages already render their own
                  Sidebar + Navbar + Footer. Do NOT wrap them in Layout again.
                */}
                <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
                <Route path="/bank-accounts" element={protectedPage(<BankAccounts />)} />
                <Route path="/budget" element={protectedPage(<Budget />)} />
                <Route path="/savings-goal" element={protectedPage(<SavingsGoal />)} />
                <Route path="/transaction-history" element={protectedPage(<TransactionHistory />)} />
                <Route path="/reports" element={protectedPage(<Reports />)} />
                <Route path="/analytics" element={protectedPage(<Analytics />)} />
                <Route path="/profile" element={protectedPage(<Profile />)} />
                <Route path="/settings" element={protectedPage(<Settings />)} />

                {/* Income and Expense are content-only pages, so they use the shared shell. */}
                <Route path="/income" element={layoutPage(<Income />)} />
                <Route path="/expense" element={layoutPage(<Expense />)} />

                {/* ADMIN */}
                <Route path="/admin" element={adminPage(<AdminDashboard />)} />
                <Route path="/admin/users" element={adminPage(<AdminUsers />)} />
                <Route path="/admin/activity-logs" element={adminPage(<AdminActivityLogs />)} />
                <Route path="/admin/premium-requests" element={adminPage(<AdminPremiumRequests />)} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
