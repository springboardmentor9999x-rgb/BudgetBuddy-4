import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import api from "../api/axios";

import { getDashboard } from "../api/dashboard";
import { getBudgetProgress } from "../api/budget";

import ProtectedLayout from "../components/ProtectedLayout";

import DashboardCards from "../components/dashboard/DashboardCards";
import ExpensePieChart from "../components/dashboard/ExpensePieChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";
import BudgetProgress from "../components/dashboard/BudgetProgress";

import MonthlyTrendLineChart from "../components/analytics/MonthlyTrendLineChart";
import SavingsProgressBar from "../components/analytics/SavingsProgressBar";


function Dashboard() {
  const { user } = useAuth();

  // =========================================================
  // Dashboard Data
  // =========================================================

  const [dashboard, setDashboard] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    expense_summary: [],
    recent_transactions: [],
  });

  // =========================================================
  // Budget Data
  // =========================================================

  const [budgets, setBudgets] = useState([]);

  // =========================================================
  // Premium Analytics Data
  // =========================================================

  const [monthlyData, setMonthlyData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);

  // =========================================================
  // Analytics Summary
  // =========================================================

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    savings_rate: 0,
  });

  // =========================================================
  // Loading
  // =========================================================

  const [loading, setLoading] = useState(true);

  // =========================================================
  // Analytics Error
  // =========================================================

  const [analyticsError, setAnalyticsError] = useState("");

  // =========================================================
  // User Role
  // =========================================================

  const role = user?.role?.toLowerCase();

  const isPremium = role === "premium";
  const isAdmin = role === "admin";

  const canViewAnalytics = isPremium || isAdmin;

  // =========================================================
  // Load Data
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [canViewAnalytics]);

  // =========================================================
  // Load Dashboard + Premium Analytics
  // =========================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setAnalyticsError("");

      // -------------------------------------------------------
      // Dashboard
      // -------------------------------------------------------

      const dashboardData = await getDashboard();

      setDashboard(dashboardData);

      // -------------------------------------------------------
      // Budgets
      // -------------------------------------------------------

      const budgetData = await getBudgetProgress();

      setBudgets(budgetData);

      // -------------------------------------------------------
      // Premium / Admin Analytics
      // -------------------------------------------------------

      if (canViewAnalytics) {
        try {
          const [
            monthlyResponse,
            savingsResponse,
            summaryResponse,
          ] = await Promise.all([
            api.get("/analytics/monthly-trend"),

            api.get("/analytics/savings-progress"),

            api.get("/analytics/summary"),
          ]);

          // Monthly trend
          setMonthlyData(
            monthlyResponse.data || []
          );

          // Savings goals
          setSavingsData(
            savingsResponse.data || []
          );

          // Analytics summary
          setSummary(
            summaryResponse.data || {
              total_income: 0,
              total_expenses: 0,
              net_balance: 0,
              savings_rate: 0,
            }
          );
        } catch (analyticsErr) {
          console.error(
            "Analytics Error:",
            analyticsErr
          );

          setAnalyticsError(
            analyticsErr.response?.data?.detail ||
            "Unable to load premium analytics."
          );
        }
      }
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Download Report
  // =========================================================

  const downloadFile = async (type) => {
    try {
      const currentDate = new Date();

      const month =
        currentDate.getMonth() + 1;

      const year =
        currentDate.getFullYear();

      const response = await api.get(
        `/reports/export/${type}`,
        {
          params: {
            month,
            year,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([
        response.data,
      ]);

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        type === "pdf"
          ? `budgetbuddy_${month}_${year}.pdf`
          : `budgetbuddy_${month}_${year}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Download error:",
        error
      );

      alert(
        "Unable to download report."
      );
    }
  };

  // =========================================================
  // Loading Screen
  // =========================================================

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <p className="text-gray-500 text-lg">
              Loading dashboard...
            </p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  // =========================================================
  // Dashboard
  // =========================================================

  return (
    <ProtectedLayout>
      <div className="space-y-8">

        {/* =====================================================
            Welcome Section
        ===================================================== */}

        <div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome Back,{" "}
                {user?.full_name || "User"} 👋
              </h1>

              <p className="text-gray-500 mt-2 text-lg">
                Here's your financial overview for today.
              </p>
            </div>

            {canViewAnalytics && (
              <div className="flex items-center gap-2">

                <span className="px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                  PREMIUM
                </span>

                <span className="text-sm text-gray-500">
                  Advanced analytics enabled
                </span>

              </div>
            )}

          </div>
        </div>

        {/* =====================================================
            Main Dashboard Cards
        ===================================================== */}

        <DashboardCards
          dashboard={dashboard}
        />

        {/* =====================================================
            Expense Distribution + Recent Transactions
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <ExpensePieChart
            data={
              dashboard.expense_summary
            }
          />

          <RecentTransactions
            transactions={
              dashboard.recent_transactions
            }
          />

        </div>

        {/* =====================================================
            Income vs Expense
        ===================================================== */}

        <div>
          <IncomeExpenseChart
            dashboard={dashboard}
          />
        </div>

        {/* =====================================================
            Budget Progress
        ===================================================== */}

        <div>
          <BudgetProgress
            budgets={budgets}
          />
        </div>

        {/* =====================================================
            PREMIUM / ADMIN ANALYTICS
        ===================================================== */}

        {canViewAnalytics && (
          <section className="pt-4">

            {/* =================================================
                Analytics Section Header
            ================================================= */}

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-7 mb-8 text-white shadow-lg">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                <div>
                  <div className="flex items-center gap-3">

                    <h2 className="text-2xl md:text-3xl font-bold">
                      Financial Analytics
                    </h2>

                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                      PREMIUM
                    </span>

                  </div>

                  <p className="text-blue-100 mt-2">
                    Get deeper insights into your income,
                    expenses and savings.
                  </p>
                </div>

                {/* Export Buttons */}

                <div className="flex flex-wrap gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      downloadFile("pdf")
                    }
                    className="px-5 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-gray-100 transition shadow-sm"
                  >
                    Export PDF
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadFile("excel")
                    }
                    className="px-5 py-2.5 rounded-xl bg-white text-green-600 font-semibold hover:bg-gray-100 transition shadow-sm"
                  >
                    Export Excel
                  </button>

                </div>

              </div>

            </div>

            {/* =================================================
                Analytics Error
            ================================================= */}

            {analyticsError && (
              <div className="mb-8 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">

                <p className="font-semibold">
                  Analytics Error
                </p>

                <p className="mt-1">
                  {analyticsError}
                </p>

              </div>
            )}

            {/* =================================================
                Analytics Summary
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

              {/* Total Income */}

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-medium text-gray-500">
                    Total Income
                  </p>

                  <span className="text-green-600 text-xl">
                    ↑
                  </span>

                </div>

                <h3 className="text-2xl font-bold mt-3 text-green-600">
                  ₹
                  {Number(
                    summary.total_income || 0
                  ).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </h3>

              </div>

              {/* Total Expenses */}

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-medium text-gray-500">
                    Total Expenses
                  </p>

                  <span className="text-red-600 text-xl">
                    ↓
                  </span>

                </div>

                <h3 className="text-2xl font-bold mt-3 text-red-600">
                  ₹
                  {Number(
                    summary.total_expenses || 0
                  ).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </h3>

              </div>

              {/* Net Balance */}

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-medium text-gray-500">
                    Net Balance
                  </p>

                  <span className="text-blue-600 text-xl">
                    ₹
                  </span>

                </div>

                <h3 className="text-2xl font-bold mt-3 text-blue-600">
                  ₹
                  {Number(
                    summary.net_balance || 0
                  ).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </h3>

              </div>

              {/* Savings Rate */}

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-medium text-gray-500">
                    Savings Rate
                  </p>

                  <span className="text-purple-600 text-xl">
                    %
                  </span>

                </div>

                <h3 className="text-2xl font-bold mt-3 text-purple-600">
                  {Number(
                    summary.savings_rate || 0
                  ).toFixed(1)}
                  %
                </h3>

              </div>

            </div>

            {/* =================================================
                Monthly Financial Trend
            ================================================= */}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">

                <div>

                  <h3 className="text-2xl font-bold text-gray-900">
                    Monthly Financial Trend
                  </h3>

                  <p className="text-gray-500 mt-1">
                    Compare your income and expenses over time.
                  </p>

                </div>

                <span className="text-sm font-medium text-gray-400">
                  Income vs Expenses
                </span>

              </div>

              <MonthlyTrendLineChart
                data={monthlyData}
              />

            </div>

            {/* =================================================
                Savings Goals
            ================================================= */}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

              <div className="mb-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  Savings Goals Progress
                </h3>

                <p className="text-gray-500 mt-1">
                  Monitor how close you are to reaching your savings goals.
                </p>

              </div>

              <SavingsProgressBar
                goals={savingsData}
              />

            </div>

          </section>
        )}

        {/* =====================================================
            Account Information
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Account Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-gray-500 text-sm">
                User ID
              </p>

              <p className="font-semibold text-lg text-gray-900 mt-1">
                {user?.id}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Full Name
              </p>

              <p className="font-semibold text-lg text-gray-900 mt-1">
                {user?.full_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Email
              </p>

              <p className="font-semibold text-lg text-gray-900 mt-1 break-all">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Role
              </p>

              <p className="font-semibold text-lg text-gray-900 mt-1 capitalize">
                {user?.role}
              </p>
            </div>

          </div>

        </div>

      </div>
    </ProtectedLayout>
  );
}

export default Dashboard;