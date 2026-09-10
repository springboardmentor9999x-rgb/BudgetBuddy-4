import "../styles/dashboard.css";
import "../styles/final.css";
import "../styles/search.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

import {
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaCoins,
  FaCrown,
  FaPiggyBank,
  FaSyncAlt,
  FaWallet,
  FaBullseye,
  FaUniversity,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFire,
  FaCalendarAlt,
  FaTrophy,
  FaChartPie,
  FaLightbulb,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuickActions from "../components/QuickActions";
import RecentIncome from "../components/RecentIncome";
import RecentExpense from "../components/RecentExpense";
import RecentTransactions from "../components/RecentTransactions";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import LoadingSpinner from "../components/LoadingSpinner";

import { getDashboardData } from "../services/dashboardService";
import { getBudget } from "../services/budgetService";
import { getSavingsGoals } from "../services/savingsGoalService";

import { useAppSettings } from "../utils/useAppSettings";
import {
  formatMoney,
  formatDateTime,
} from "../utils/settings";


// =========================================================
// HELPERS
// =========================================================

const safeArray = (value) => (
  Array.isArray(value) ? value : []
);

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


// =========================================================
// CHART COLORS
// =========================================================

const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];


// =========================================================
// CUSTOM TOOLTIP
// =========================================================

function FinancialTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="financial-tooltip">
      {label && (
        <div className="financial-tooltip-title">
          {label}
        </div>
      )}

      {payload.map((item, index) => (
        <div
          className="financial-tooltip-row"
          key={`${item.dataKey}-${index}`}
        >
          <span>
            <i
              className="tooltip-dot"
              style={{
                background:
                  item.color || CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            {item.name || item.dataKey}
          </span>

          <strong>
            {formatMoney(item.value, currency)}
          </strong>
        </div>
      ))}
    </div>
  );
}


// =========================================================
// DASHBOARD
// =========================================================

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const settings = useAppSettings();

  const currency =
    settings?.currency || "INR";

  // Admin is a separate role, not a customer Premium/Pro tier.
  // Only non-admin Premium accounts receive the PRO badge and Pro features.
  const isPro =
    user?.role !== "admin" &&
    String(user?.account_tier || "normal").toLowerCase() ===
    "premium";

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [income, setIncome] = useState([]);
  const [expense, setExpense] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  // -------------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------------

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      }

      try {
        const [
          dashboardData,
          budgetData,
          goalData,
        ] = await Promise.all([
          getDashboardData(),
          getBudget(new Date().getFullYear()),
          getSavingsGoals(),
        ]);

        setIncome(
          safeArray(dashboardData?.income)
        );

        setExpense(
          safeArray(dashboardData?.expense)
        );

        setBudgets(
          safeArray(budgetData)
        );

        setGoals(
          safeArray(goalData)
        );

        setSummary({
          totalIncome: num(
            dashboardData?.totalIncome
          ),

          totalExpense: num(
            dashboardData?.totalExpense
          ),

          balance: num(
            dashboardData?.balance
          ),
        });
      } catch (error) {
        console.error(
          "Dashboard loading failed:",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  // -------------------------------------------------------
  // AUTO REFRESH
  // -------------------------------------------------------

  useEffect(() => {
    loadDashboard();

    const refresh = () => {
      loadDashboard(true);
    };

    const onDataChanged = () => {
      loadDashboard(true);
    };

    const onVisibility = () => {
      if (
        document.visibilityState === "visible"
      ) {
        loadDashboard(true);
      }
    };

    window.addEventListener(
      "focus",
      refresh
    );

    window.addEventListener(
      "bb:data-changed",
      onDataChanged
    );

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {
      window.removeEventListener(
        "focus",
        refresh
      );

      window.removeEventListener(
        "bb:data-changed",
        onDataChanged
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, [loadDashboard]);


  // =======================================================
  // TRANSACTIONS
  // =======================================================

  const transactions = useMemo(() => {
    return [
      ...income.map((item) => ({
        ...item,
        kind: "Income",
        date:
          item.transaction_date ||
          item.created_at,
      })),

      ...expense.map((item) => ({
        ...item,
        kind: "Expense",
        date:
          item.transaction_date ||
          item.created_at,
      })),
    ];
  }, [income, expense]);


  // =======================================================
  // DAILY TREND
  // =======================================================

  const dailyTrend = useMemo(() => {
    const map = {};

    transactions.forEach((transaction) => {
      if (!transaction.date) {
        return;
      }

      const date = new Date(
        transaction.date
      );

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key =
        date.toISOString().slice(0, 10);

      if (!map[key]) {
        map[key] = {
          date: key,
          income: 0,
          expense: 0,
          savings: 0,
        };
      }

      if (
        transaction.kind === "Income"
      ) {
        map[key].income += num(
          transaction.amount
        );
      } else {
        map[key].expense += num(
          transaction.amount
        );
      }

      map[key].savings =
        map[key].income -
        map[key].expense;
    });

    return Object.values(map)
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      .slice(-14)
      .map((item) => ({
        ...item,
        label: item.date.slice(5),
      }));
  }, [transactions]);


  // =======================================================
  // INCOME CATEGORY
  // =======================================================

  const incomeCategoryData = useMemo(() => {
    const map = {};

    income.forEach((item) => {
      const category =
        item.category ||
        item.source ||
        "Other";

      map[category] =
        (map[category] || 0) +
        num(item.amount);
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [income]);


  // =======================================================
  // EXPENSE CATEGORY
  // =======================================================

  const expenseCategoryData = useMemo(() => {
    const map = {};

    expense.forEach((item) => {
      const category =
        item.category || "Other";

      map[category] =
        (map[category] || 0) +
        num(item.amount);
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [expense]);


  // =======================================================
  // BANK-WISE ANALYSIS
  // =======================================================

  const bankAnalysis = useMemo(() => {
    const map = {};

    income.forEach((item) => {
      const bank =
        item.bank_account_id
          ? `Account ${item.bank_account_id}`
          : "Unassigned";

      if (!map[bank]) {
        map[bank] = {
          bank,
          income: 0,
          expense: 0,
        };
      }

      map[bank].income += num(
        item.amount
      );
    });

    expense.forEach((item) => {
      const bank =
        item.bank_account_id
          ? `Account ${item.bank_account_id}`
          : "Unassigned";

      if (!map[bank]) {
        map[bank] = {
          bank,
          income: 0,
          expense: 0,
        };
      }

      map[bank].expense += num(
        item.amount
      );
    });

    return Object.values(map)
      .sort(
        (a, b) =>
          (b.income + b.expense) -
          (a.income + a.expense)
      )
      .slice(0, 8);
  }, [income, expense]);


  // =======================================================
  // BUDGET CARDS
  // =======================================================

  const budgetCards = useMemo(() => {
    return budgets.map((budget) => {
      const category =
        normalize(budget.category);

      const spent = expense
        .filter(
          (item) =>
            normalize(item.category) ===
            category
        )
        .reduce(
          (sum, item) =>
            sum + num(item.amount),
          0
        );

      const total =
        num(budget.budget_amount);

      const percentage =
        total > 0
          ? Math.min(
              100,
              (spent / total) * 100
            )
          : 0;

      return {
        ...budget,
        spent,
        remaining: Math.max(
          0,
          total - spent
        ),
        pct: percentage,
      };
    });
  }, [budgets, expense]);


  // =======================================================
  // SAVINGS CARDS
  // =======================================================

  const savingsCards = useMemo(() => {
    return goals.map((goal) => {
      const target =
        num(goal.target_amount);

      const saved =
        num(goal.saved_amount);

      const percentage =
        target > 0
          ? Math.min(
              100,
              (saved / target) * 100
            )
          : 0;

      return {
        ...goal,
        target,
        saved,
        remaining: Math.max(
          0,
          target - saved
        ),
        pct: percentage,
      };
    });
  }, [goals]);


  // =======================================================
  // TOTALS
  // =======================================================

  const totalBudget = budgetCards.reduce(
    (sum, item) =>
      sum + num(item.budget_amount),
    0
  );

  const totalSaved = savingsCards.reduce(
    (sum, item) =>
      sum + item.saved,
    0
  );

  const totalTarget = savingsCards.reduce(
    (sum, item) =>
      sum + item.target,
    0
  );

  const budgetPercentage =
    totalBudget > 0
      ? Math.min(
          100,
          (summary.totalExpense /
            totalBudget) *
            100
        )
      : 0;

  const savingsPercentage =
    totalTarget > 0
      ? Math.min(
          100,
          (totalSaved /
            totalTarget) *
            100
        )
      : 0;


  // =======================================================
  // FINANCIAL HEALTH SCORE
  // =======================================================

  const financialHealth = useMemo(() => {
    let score = 50;

    if (
      summary.totalIncome > 0 &&
      summary.balance >= 0
    ) {
      score += 20;
    }

    if (
      summary.totalIncome > 0 &&
      summary.totalExpense <
        summary.totalIncome * 0.7
    ) {
      score += 15;
    }

    if (
      savingsPercentage >= 50
    ) {
      score += 10;
    }

    if (
      budgetPercentage <= 80
    ) {
      score += 5;
    }

    return Math.min(
      100,
      Math.max(0, score)
    );
  }, [
    summary,
    savingsPercentage,
    budgetPercentage,
  ]);


  // =======================================================
  // BUDGET ALERTS
  // =======================================================

  const budgetAlerts = useMemo(() => {
    return budgetCards
      .filter(
        (budget) =>
          budget.pct >= 80
      )
      .sort(
        (a, b) =>
          b.pct - a.pct
      );
  }, [budgetCards]);


  // =======================================================
  // TOP SPENDING
  // =======================================================

  const topSpendingCategory =
    expenseCategoryData[0] || null;


  // =======================================================
  // FILTERED TRANSACTIONS
  // =======================================================

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const matches = (item) => {
      if (!query) {
        return true;
      }

      return [
        item.source,
        item.category,
        item.description,
        item.bank_account_id,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    };

    return {
      income:
        filter === "Expense"
          ? []
          : income.filter(matches),

      expense:
        filter === "Income"
          ? []
          : expense.filter(matches),
    };
  }, [
    search,
    filter,
    income,
    expense,
  ]);


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return <LoadingSpinner />;
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <>
      <Sidebar />
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="dashboard-hero advanced-hero">

            <div className="hero-main-content">

              <div className="dashboard-eyebrow">
                BUDGETBUDDY • FINANCIAL CONTROL CENTER
              </div>

              <div className="dashboard-title-row">

                <h1>
                  Welcome back,{" "}
                  {user?.full_name || "User"} 👋
                </h1>

                {isPro && (
                  <span className="dashboard-pro-badge">
                    <FaCrown />
                    PRO
                  </span>
                )}

              </div>

              <p>
                Monitor your cash flow, spending,
                budgets and savings from one
                intelligent dashboard.
              </p>

              <div className="dashboard-meta">
                <FaCalendarAlt />
                Updated{" "}
                {formatDateTime(
                  new Date(),
                  settings.dateFormat
                )}
              </div>

            </div>

            <div className="hero-actions">

              <div className="hero-health-mini">
                <span>
                  Financial Health
                </span>

                <strong>
                  {financialHealth}/100
                </strong>
              </div>

              <button
                className="dashboard-refresh-btn"
                onClick={() =>
                  loadDashboard(true)
                }
                disabled={refreshing}
              >
                <FaSyncAlt
                  className={
                    refreshing
                      ? "spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

          </section>


          {/* =================================================
              KPI CARDS
          ================================================= */}

          <section className="dashboard-summary-grid advanced-kpi-grid">

            <div className="dash-stat income">

              <span className="dash-stat-icon">
                <FaArrowUp />
              </span>

              <span className="dash-stat-label">
                TOTAL INCOME
              </span>

              <strong>
                {formatMoney(
                  summary.totalIncome,
                  currency
                )}
              </strong>

              <small>
                Total recorded inflow
              </small>

            </div>


            <div className="dash-stat expense">

              <span className="dash-stat-icon">
                <FaArrowDown />
              </span>

              <span className="dash-stat-label">
                TOTAL EXPENSE
              </span>

              <strong>
                {formatMoney(
                  summary.totalExpense,
                  currency
                )}
              </strong>

              <small>
                Total recorded spending
              </small>

            </div>


            <div className="dash-stat balance">

              <span className="dash-stat-icon">
                <FaWallet />
              </span>

              <span className="dash-stat-label">
                AVAILABLE BALANCE
              </span>

              <strong>
                {formatMoney(
                  summary.balance,
                  currency
                )}
              </strong>

              <small>
                {summary.balance >= 0
                  ? "Positive cash position"
                  : "Negative cash position"}
              </small>

            </div>


            <div className="dash-stat savings">

              <span className="dash-stat-icon">
                <FaPiggyBank />
              </span>

              <span className="dash-stat-label">
                SAVINGS PROGRESS
              </span>

              <strong>
                {savingsPercentage.toFixed(0)}%
              </strong>

              <small>
                {formatMoney(
                  totalSaved,
                  currency
                )}{" "}
                saved
              </small>

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <QuickActions />


          {isPro ? (
            <>
          {/* =================================================
              ADVANCED INSIGHT ROW
          ================================================= */}

          <section className="dashboard-insight-grid">

            <div className="insight-card health-card">

              <div className="insight-icon">
                <FaChartLine />
              </div>

              <div>
                <span>
                  FINANCIAL HEALTH
                </span>

                <strong>
                  {financialHealth}/100
                </strong>

                <small>
                  {financialHealth >= 80
                    ? "Excellent financial position"
                    : financialHealth >= 60
                    ? "Good — keep improving"
                    : "Needs attention"}
                </small>
              </div>

            </div>


            <div className="insight-card">

              <div className="insight-icon">
                <FaFire />
              </div>

              <div>
                <span>
                  TOP SPENDING
                </span>

                <strong>
                  {topSpendingCategory
                    ? topSpendingCategory.name
                    : "—"}
                </strong>

                <small>
                  {topSpendingCategory
                    ? formatMoney(
                        topSpendingCategory.value,
                        currency
                      )
                    : "No expenses yet"}
                </small>
              </div>

            </div>


            <div className="insight-card">

              <div className="insight-icon">
                <FaBullseye />
              </div>

              <div>
                <span>
                  SAVINGS TARGET
                </span>

                <strong>
                  {savingsPercentage.toFixed(0)}%
                </strong>

                <small>
                  {formatMoney(
                    totalSaved,
                    currency
                  )}{" "}
                  /{" "}
                  {formatMoney(
                    totalTarget,
                    currency
                  )}
                </small>
              </div>

            </div>


            <div className="insight-card">

              <div className="insight-icon">
                {budgetAlerts.length > 0
                  ? <FaExclamationTriangle />
                  : <FaCheckCircle />}
              </div>

              <div>
                <span>
                  BUDGET ALERTS
                </span>

                <strong>
                  {budgetAlerts.length}
                </strong>

                <small>
                  {budgetAlerts.length
                    ? "Budget categories need attention"
                    : "All budgets under control"}
                </small>
              </div>

            </div>

          </section>


          {/* =================================================
              MAIN CASH FLOW
          ================================================= */}

          <section className="dashboard-chart-grid">

            <article className="dash-panel dash-chart-large">

              <div className="dash-panel-head">

                <div>
                  <span>
                    CASH FLOW ANALYTICS
                  </span>

                  <h2>
                    Income vs Expense
                  </h2>

                  <small>
                    Recent financial activity
                  </small>
                </div>

                <FaChartLine />

              </div>

              <div className="dash-chart advanced-chart">

                {dailyTrend.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <AreaChart
                      data={dailyTrend}
                    >

                      <defs>

                        <linearGradient
                          id="incomeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopOpacity={0.3}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopOpacity={0.25}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0}
                          />
                        </linearGradient>

                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.45}
                      />

                      <XAxis
                        dataKey="label"
                        tickLine={false}
                      />

                      <YAxis
                        tickLine={false}
                        tickFormatter={(value) =>
                          `${Math.round(
                            value / 1000
                          )}k`
                        }
                      />

                      <Tooltip
                        content={
                          <FinancialTooltip
                            currency={currency}
                          />
                        }
                      />

                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#incomeGradient)"
                      />

                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#expenseGradient)"
                      />

                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="Net Flow"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        fill="none"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="dash-empty">
                    No transaction data available
                  </div>

                )}

              </div>

            </article>


            {/* =================================================
                EXPENSE CATEGORY
            ================================================= */}

            <article className="dash-panel">

              <div className="dash-panel-head">

                <div>
                  <span>
                    SPENDING ANALYTICS
                  </span>

                  <h2>
                    Expense by Category
                  </h2>
                </div>

                <FaChartPie />

              </div>

              {expenseCategoryData.length > 0 ? (

                <div className="dash-category-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          expenseCategoryData
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                      >

                        {expenseCategoryData.map(
                          (item, index) => (
                            <Cell
                              key={
                                `${item.name}-${index}`
                              }
                              fill={
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatMoney(
                            value,
                            currency
                          )
                        }
                      />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="dash-empty">
                  No expense categories yet.
                </div>

              )}

              <div className="dash-category-list">

                {expenseCategoryData
                  .slice(0, 5)
                  .map((item, index) => (

                    <div
                      key={item.name}
                      className="category-list-item"
                    >

                      <span>
                        <i
                          style={{
                            background:
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ],
                          }}
                        />

                        {item.name}
                      </span>

                      <strong>
                        {formatMoney(
                          item.value,
                          currency
                        )}
                      </strong>

                    </div>

                  ))}

              </div>

            </article>

          </section>


          {/* =================================================
              DAILY TREND
          ================================================= */}

          <section className="dashboard-chart-grid">

            <article className="dash-panel dash-chart-large">

              <div className="dash-panel-head">

                <div>
                  <span>
                    DAILY PERFORMANCE
                  </span>

                  <h2>
                    Daily Income / Expense Trend
                  </h2>
                </div>

                <FaChartLine />

              </div>

              <div className="dash-chart">

                {dailyTrend.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={dailyTrend}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.4}
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis
                        tickFormatter={(value) =>
                          `${Math.round(
                            value / 1000
                          )}k`
                        }
                      />

                      <Tooltip
                        content={
                          <FinancialTooltip
                            currency={currency}
                          />
                        }
                      />

                      <Legend />

                      <Bar
                        dataKey="income"
                        name="Income"
                        fill="#10b981"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />

                      <Bar
                        dataKey="expense"
                        name="Expense"
                        fill="#ef4444"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="dash-empty">
                    No daily transaction data available.
                  </div>

                )}

              </div>

            </article>


            {/* =================================================
                INCOME CATEGORY
            ================================================= */}

            <article className="dash-panel">

              <div className="dash-panel-head">

                <div>
                  <span>
                    INCOME ANALYTICS
                  </span>

                  <h2>
                    Income by Category
                  </h2>
                </div>

                <FaCoins />

              </div>

              {incomeCategoryData.length > 0 ? (

                <div className="dash-category-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          incomeCategoryData
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                      >

                        {incomeCategoryData.map(
                          (item, index) => (
                            <Cell
                              key={
                                `${item.name}-${index}`
                              }
                              fill={
                                CHART_COLORS[
                                  (index + 2) %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatMoney(
                            value,
                            currency
                          )
                        }
                      />

                    </PieChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <div className="dash-empty">
                  No income categories yet.
                </div>

              )}

              <div className="dash-category-list">

                {incomeCategoryData
                  .slice(0, 5)
                  .map((item, index) => (

                    <div
                      key={item.name}
                      className="category-list-item"
                    >

                      <span>
                        <i
                          style={{
                            background:
                              CHART_COLORS[
                                (index + 2) %
                                  CHART_COLORS.length
                              ],
                          }}
                        />

                        {item.name}
                      </span>

                      <strong>
                        {formatMoney(
                          item.value,
                          currency
                        )}
                      </strong>

                    </div>

                  ))}

              </div>

            </article>

          </section>


          {/* =================================================
              BANK ANALYSIS
          ================================================= */}

          <section className="dash-panel full-width-chart">

            <div className="dash-panel-head">

              <div>
                <span>
                  BANK & ACCOUNT ANALYTICS
                </span>

                <h2>
                  Bank-wise Financial Activity
                </h2>

                <small>
                  Compare income and expenses across
                  linked bank accounts.
                </small>
              </div>

              <FaUniversity />

            </div>

            <div className="bank-chart">

              {bankAnalysis.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={bankAnalysis}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.4}
                    />

                    <XAxis
                      dataKey="bank"
                    />

                    <YAxis
                      tickFormatter={(value) =>
                        `${Math.round(
                          value / 1000
                        )}k`
                      }
                    />

                    <Tooltip
                      content={
                        <FinancialTooltip
                          currency={currency}
                        />
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#10b981"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#ef4444"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="dash-empty">
                  Add bank accounts and transactions
                  to see bank-wise analysis.
                </div>

              )}

            </div>

          </section>


            </>
          ) : null}

          {/* =================================================
              BUDGET + SAVINGS
          ================================================= */}

          <section className="dashboard-progress-grid">

            {/* =================================================
                BUDGET
            ================================================= */}

            <article className="dash-panel progress-panel">

              <div className="dash-panel-head">

                <div>
                  <span>
                    BUDGET CONTROL
                  </span>

                  <h2>
                    Every Budget, Its Own Progress
                  </h2>
                </div>

                <b>
                  {budgetCards.length}
                </b>

              </div>


              <div className="progress-overall">

                <span>
                  Overall utilisation
                </span>

                <strong>
                  {budgetPercentage.toFixed(0)}%
                </strong>

              </div>

              <div className="progress-track">

                <span
                  style={{
                    width: `${budgetPercentage}%`,
                  }}
                />

              </div>


              <div className="progress-scroll">

                {budgetCards.length ? (

                  budgetCards.map((budget) => (

                    <div
                      className="progress-item"
                      key={budget.id}
                    >

                      <div className="progress-item-top">

                        <div>

                          <strong>
                            {budget.category ||
                              "Budget"}
                          </strong>

                          <small>
                            {formatMoney(
                              budget.spent,
                              currency
                            )}{" "}
                            spent of{" "}
                            {formatMoney(
                              budget.budget_amount,
                              currency
                            )}
                          </small>

                        </div>

                        <b
                          className={
                            budget.pct >= 100
                              ? "danger"
                              : budget.pct >= 80
                              ? "warning"
                              : ""
                          }
                        >
                          {budget.pct.toFixed(0)}%
                        </b>

                      </div>


                      <div className="progress-track small">

                        <span
                          style={{
                            width: `${budget.pct}%`,
                          }}
                        />

                      </div>


                      <div className="progress-item-bottom">

                        <span>
                          {formatMoney(
                            budget.remaining,
                            currency
                          )}{" "}
                          remaining
                        </span>

                        <span>
                          {budget.pct >= 100
                            ? "Limit reached"
                            : budget.pct >= 80
                            ? "Near limit"
                            : "Healthy"}
                        </span>

                      </div>

                    </div>

                  ))

                ) : (

                  <div className="dash-empty">
                    Create your first budget to
                    start tracking category-level
                    progress.
                  </div>

                )}

              </div>

            </article>


            {/* =================================================
                SAVINGS
            ================================================= */}

            <article className="dash-panel progress-panel savings-panel">

              <div className="dash-panel-head">

                <div>
                  <span>
                    SAVINGS CONTROL
                  </span>

                  <h2>
                    Every Goal, Its Own Progress
                  </h2>
                </div>

                <b>
                  {savingsCards.length}
                </b>

              </div>


              <div className="progress-overall">

                <span>
                  Combined savings
                </span>

                <strong>
                  {savingsPercentage.toFixed(0)}%
                </strong>

              </div>

              <div className="progress-track">

                <span
                  style={{
                    width: `${savingsPercentage}%`,
                  }}
                />

              </div>


              <div className="progress-scroll">

                {savingsCards.length ? (

                  savingsCards.map((goal) => (

                    <div
                      className="progress-item"
                      key={goal.id}
                    >

                      <div className="progress-item-top">

                        <div>

                          <strong>
                            {goal.goal_name ||
                              "Savings goal"}
                          </strong>

                          <small>
                            {formatMoney(
                              goal.saved,
                              currency
                            )}{" "}
                            saved of{" "}
                            {formatMoney(
                              goal.target,
                              currency
                            )}
                          </small>

                        </div>

                        <b>
                          {goal.pct.toFixed(0)}%
                        </b>

                      </div>


                      <div className="progress-track small">

                        <span
                          style={{
                            width: `${goal.pct}%`,
                          }}
                        />

                      </div>


                      <div className="progress-item-bottom">

                        <span>
                          {formatMoney(
                            goal.remaining,
                            currency
                          )}{" "}
                          remaining
                        </span>

                        <span>
                          {goal.pct >= 100
                            ? "Completed"
                            : goal.pct >= 80
                            ? "Almost there"
                            : "In progress"}
                        </span>

                      </div>

                    </div>

                  ))

                ) : (

                  <div className="dash-empty">
                    Create a savings goal to start
                    tracking your progress.
                  </div>

                )}

              </div>

            </article>

          </section>


          {isPro ? (
            <>
          {/* =================================================
              ADVANCED FINANCIAL INSIGHTS
          ================================================= */}

          <section className="advanced-insights-panel">

            <div className="advanced-insights-header">

              <div>
                <span>
                  <FaLightbulb />
                  SMART FINANCIAL INSIGHTS
                </span>

                <h2>
                  What your dashboard is telling you
                </h2>
              </div>

              <FaTrophy />

            </div>


            <div className="smart-insights-grid">

              <div className="smart-insight">

                <div className="smart-insight-icon">
                  <FaArrowUp />
                </div>

                <div>

                  <strong>
                    Cash Flow
                  </strong>

                  <p>
                    {summary.balance >= 0
                      ? "Your recorded income is currently covering your expenses."
                      : "Your expenses are currently higher than your recorded income."}
                  </p>

                </div>

              </div>


              <div className="smart-insight">

                <div className="smart-insight-icon">
                  <FaChartPie />
                </div>

                <div>

                  <strong>
                    Spending Concentration
                  </strong>

                  <p>
                    {topSpendingCategory
                      ? `${topSpendingCategory.name} is currently your highest spending category.`
                      : "Add expenses to identify your biggest spending category."}
                  </p>

                </div>

              </div>


              <div className="smart-insight">

                <div className="smart-insight-icon">
                  <FaBullseye />
                </div>

                <div>

                  <strong>
                    Savings Momentum
                  </strong>

                  <p>
                    {savingsPercentage >= 80
                      ? "Excellent progress toward your savings targets."
                      : savingsPercentage >= 50
                      ? "Your savings are moving in the right direction."
                      : "Increase regular savings contributions to reach your targets faster."}
                  </p>

                </div>

              </div>


              <div className="smart-insight">

                <div className="smart-insight-icon">
                  <FaExclamationTriangle />
                </div>

                <div>

                  <strong>
                    Budget Discipline
                  </strong>

                  <p>
                    {budgetAlerts.length === 0
                      ? "Your current budgets are below the warning threshold."
                      : `${budgetAlerts.length} budget ${budgetAlerts.length === 1 ? "category is" : "categories are"} approaching or exceeding the limit.`}
                  </p>

                </div>

              </div>

            </div>

          </section>


            </>
          ) : null}

          {/* =================================================
              PRO / NORMAL
          ================================================= */}

          {!isAdmin && isPro && (

            <section className="pro-intelligence">

              <div>

                <span>
                  <FaCrown />
                  PRO INTELLIGENCE
                </span>

                <h2>
                  Advanced financial intelligence
                </h2>

                <p>
                  Your Pro dashboard includes deeper
                  cash-flow analytics, category
                  concentration, budget monitoring,
                  savings momentum and financial-health
                  signals.
                </p>

              </div>


              <div className="pro-metrics">

                <div>
                  <strong>
                    {transactions.length}
                  </strong>

                  <small>
                    Transactions analysed
                  </small>
                </div>


                <div>
                  <strong>
                    {budgetAlerts.length}
                  </strong>

                  <small>
                    Budgets requiring attention
                  </small>
                </div>


                <div>
                  <strong>
                    {savingsCards.filter(
                      (item) =>
                        item.pct >= 80
                    ).length}
                  </strong>

                  <small>
                    Goals near target
                  </small>
                </div>


                <div>
                  <strong>
                    {financialHealth}
                  </strong>

                  <small>
                    Financial health score
                  </small>
                </div>

              </div>

            </section>

          )}

          {!isAdmin && !isPro && (

            <section className="normal-upgrade">

              <div>

                <span>
                  NORMAL PLAN
                </span>

                <h2>
                  Core finance management
                </h2>

                <p>
                  Track income, expenses, budgets,
                  savings and standard analytics.
                  Upgrade to Pro for advanced financial
                  intelligence and deeper insights.
                </p>

              </div>


              <div className="upgrade-points">

                <span>
                  ✓ Income & expense tracking
                </span>

                <span>
                  ✓ Budget management
                </span>

                <span>
                  ✓ Savings tracking
                </span>

                <span>
                  ✓ Standard analytics
                </span>

              </div>

            </section>

          )}


          {/* =================================================
              SEARCH / FILTER
          ================================================= */}

          <section className="dashboard-filter-grid">

            <SearchBar
              value={search}
              onChange={setSearch}
            />

            <FilterBar
              value={filter}
              onChange={setFilter}
            />

          </section>


          {/* =================================================
              RECENT DATA
          ================================================= */}

          <section className="dashboard-two-column">

            <RecentIncome
              income={filtered.income}
            />

            <RecentExpense
              expense={filtered.expense}
            />

          </section>


          <section className="dashboard-section">

            <RecentTransactions
              income={filtered.income}
              expense={filtered.expense}
            />

          </section>


          <Footer />

        </div>
      </main>
    </>
  );
}

export default Dashboard;