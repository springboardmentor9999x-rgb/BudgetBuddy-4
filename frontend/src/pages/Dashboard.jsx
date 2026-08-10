import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import { getDashboard } from "../api/dashboard";
import { getBudgetProgress } from "../api/budget";

import ProtectedLayout from "../components/ProtectedLayout";

import DashboardCards from "../components/dashboard/DashboardCards";
import ExpensePieChart from "../components/dashboard/ExpensePieChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";
import BudgetProgress from "../components/dashboard/BudgetProgress";

function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    expense_summary: [],
    recent_transactions: [],
  });

  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await getDashboard();
      setDashboard(dashboardData);

      const budgetData = await getBudgetProgress();
      setBudgets(budgetData);

    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  return (
    <ProtectedLayout>

      {/* Welcome */}
      <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-900">
          Welcome Back, {user?.full_name || "User"} 👋
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Here's your financial overview for today.
        </p>

      </div>

      {/* Dashboard Cards */}
      <DashboardCards dashboard={dashboard} />

      {/* Expense Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

        <ExpensePieChart
          data={dashboard.expense_summary}
        />

        <RecentTransactions
          transactions={dashboard.recent_transactions}
        />

      </div>

      {/* Income vs Expense */}
      <div className="mt-8">

        <IncomeExpenseChart
          dashboard={dashboard}
        />

      </div>

      {/* Budget Progress */}
      <div className="mt-8">

        <BudgetProgress
          budgets={budgets}
        />

      </div>

      {/* Account Information */}
      <div className="mt-8 bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <p className="text-gray-500">
              User ID
            </p>

            <p className="font-semibold text-lg">
              {user?.id}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Full Name
            </p>

            <p className="font-semibold text-lg">
              {user?.full_name || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Email
            </p>

            <p className="font-semibold text-lg">
              {user?.email}
            </p>
          </div>

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

    </ProtectedLayout>
  );
}

export default Dashboard;