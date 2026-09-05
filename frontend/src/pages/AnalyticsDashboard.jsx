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

import SpendingPieChart from "../components/analytics/SpendingPieChart";
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


  const [budgets, setBudgets] =
    useState([]);


  // =========================================================
  // Analytics Data
  // =========================================================

  const [spendingData, setSpendingData] =
    useState([]);


  const [monthlyData, setMonthlyData] =
    useState([]);


  const [savingsData, setSavingsData] =
    useState([]);


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

  const [loading, setLoading] =
    useState(true);


  // =========================================================
  // Analytics Error
  // =========================================================

  const [analyticsError, setAnalyticsError] =
    useState("");


  // =========================================================
  // Check User Role
  // =========================================================

  const role =
    user?.role?.toLowerCase();


  const isPremium =
    role === "premium";


  const isAdmin =
    role === "admin";


  const canViewAnalytics =
    isPremium || isAdmin;


  // =========================================================
  // Load Dashboard
  // =========================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // =========================================================
  // Load Dashboard + Analytics
  // =========================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);

      setAnalyticsError("");


      // -----------------------------------------------------
      // Normal Dashboard Data
      // -----------------------------------------------------

      const dashboardData =
        await getDashboard();


      setDashboard(
        dashboardData
      );


      // -----------------------------------------------------
      // Budget Data
      // -----------------------------------------------------

      const budgetData =
        await getBudgetProgress();


      setBudgets(
        budgetData
      );


      // -----------------------------------------------------
      // Analytics
      // -----------------------------------------------------

      if (canViewAnalytics) {

        try {

          const [

            spendingResponse,

            monthlyResponse,

            savingsResponse,

            summaryResponse,

          ] = await Promise.all([

            api.get(
              "/analytics/spending-by-category"
            ),

            api.get(
              "/analytics/monthly-trend"
            ),

            api.get(
              "/analytics/savings-progress"
            ),

            api.get(
              "/analytics/summary"
            ),

          ]);


          setSpendingData(
            spendingResponse.data || []
          );


          setMonthlyData(
            monthlyResponse.data || []
          );


          setSavingsData(
            savingsResponse.data || []
          );


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
            "Unable to load analytics."
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

  const downloadFile = async (
    type
  ) => {

    try {

      const currentDate =
        new Date();


      const month =
        currentDate.getMonth() + 1;


      const year =
        currentDate.getFullYear();


      const response =
        await api.get(

          `/reports/export/${type}`,

          {

            params: {

              month,

              year,

            },

            responseType: "blob",

          }

        );


      const blob =
        new Blob(
          [response.data]
        );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement("a");


      link.href =
        url;


      link.download =
        type === "pdf"

          ? `budgetbuddy_${month}_${year}.pdf`

          : `budgetbuddy_${month}_${year}.xlsx`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        url
      );

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

      <div>


        {/* =================================================
            Welcome
        ================================================= */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">

            Welcome Back,{" "}

            {user?.full_name || "User"}

            {" "}👋

          </h1>


          <p className="text-gray-500 mt-2 text-lg">

            Here's your financial overview for today.

          </p>

        </div>


        {/* =================================================
            Dashboard Cards
        ================================================= */}

        <DashboardCards
          dashboard={dashboard}
        />


        {/* =================================================
            Expense Chart + Recent Transactions
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">


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


        {/* =================================================
            Income vs Expense
        ================================================= */}

        <div className="mt-8">

          <IncomeExpenseChart
            dashboard={dashboard}
          />

        </div>


        {/* =================================================
            Budget Progress
        ================================================= */}

        <div className="mt-8">

          <BudgetProgress
            budgets={budgets}
          />

        </div>


        {/* =================================================
            PREMIUM / ADMIN ANALYTICS
        ================================================= */}

        {canViewAnalytics && (

          <div className="mt-10">


            {/* =================================================
                Analytics Header
            ================================================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">


              <div>

                <h2 className="text-3xl font-bold text-gray-900">

                  Financial Analytics

                </h2>


                <p className="text-gray-500 mt-2">

                  Track your financial performance
                  and spending patterns.

                </p>

              </div>


              {/* =================================================
                  Export Buttons
              ================================================= */}

              <div className="flex gap-3">


                <button
                  type="button"
                  onClick={() =>
                    downloadFile("pdf")
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                >

                  Export PDF

                </button>


                <button
                  type="button"
                  onClick={() =>
                    downloadFile("excel")
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                >

                  Export Excel

                </button>


              </div>

            </div>


            {/* =================================================
                Analytics Error
            ================================================= */}

            {analyticsError && (

              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">

                <p className="font-semibold">

                  Analytics Error

                </p>


                <p className="mt-1">

                  {analyticsError}

                </p>

              </div>

            )}


            {/* =================================================
                Analytics Summary Cards
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">


              {/* Total Income */}

              <div className="bg-white rounded-2xl shadow-md p-6">

                <p className="text-gray-500">

                  Total Income

                </p>


                <h3 className="text-2xl font-bold mt-2 text-green-600">

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

              <div className="bg-white rounded-2xl shadow-md p-6">

                <p className="text-gray-500">

                  Total Expenses

                </p>


                <h3 className="text-2xl font-bold mt-2 text-red-600">

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

              <div className="bg-white rounded-2xl shadow-md p-6">

                <p className="text-gray-500">

                  Net Balance

                </p>


                <h3 className="text-2xl font-bold mt-2 text-blue-600">

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

              <div className="bg-white rounded-2xl shadow-md p-6">

                <p className="text-gray-500">

                  Savings Rate

                </p>


                <h3 className="text-2xl font-bold mt-2 text-purple-600">

                  {Number(
                    summary.savings_rate || 0
                  ).toFixed(1)}

                  %

                </h3>

              </div>


            </div>


            {/* =================================================
                Analytics Charts
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">


              {/* Spending by Category */}

              <div className="bg-white rounded-2xl shadow-md p-5">

                <h3 className="text-xl font-bold text-gray-900 mb-4">

                  Spending by Category

                </h3>


                <SpendingPieChart
                  data={spendingData}
                />

              </div>


              {/* Monthly Trend */}

              <div className="bg-white rounded-2xl shadow-md p-5">

                <h3 className="text-xl font-bold text-gray-900 mb-4">

                  Monthly Financial Trend

                </h3>


                <MonthlyTrendLineChart
                  data={monthlyData}
                />

              </div>


            </div>


            {/* =================================================
                Savings Progress
            ================================================= */}

            <div className="bg-white rounded-2xl shadow-md p-6">

              <h3 className="text-xl font-bold text-gray-900 mb-5">

                Savings Goals Progress

              </h3>


              <SavingsProgressBar
                goals={savingsData}
              />

            </div>


          </div>

        )}


        {/* =================================================
            Account Information
        ================================================= */}

        <div className="mt-8 bg-white rounded-2xl shadow-md p-6">


          <h2 className="text-2xl font-bold mb-6">

            Account Information

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            {/* User ID */}

            <div>

              <p className="text-gray-500">

                User ID

              </p>


              <p className="font-semibold text-lg">

                {user?.id}

              </p>

            </div>


            {/* Full Name */}

            <div>

              <p className="text-gray-500">

                Full Name

              </p>


              <p className="font-semibold text-lg">

                {user?.full_name || "N/A"}

              </p>

            </div>


            {/* Email */}

            <div>

              <p className="text-gray-500">

                Email

              </p>


              <p className="font-semibold text-lg">

                {user?.email}

              </p>

            </div>


            {/* Role */}

            <div>

              <p className="text-gray-500">

                Role

              </p>


              <p className="font-semibold text-lg">

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