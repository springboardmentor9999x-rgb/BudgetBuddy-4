import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import {
  FaCrown,
  FaFileExcel,
  FaFilePdf,
  FaChartPie,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaPiggyBank,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { toast } from "../utils/notifications";

import { getIncome } from "../services/incomeService";
import { getExpense } from "../services/expenseService";
import { getBudget } from "../services/budgetService";
import { getSavingsGoals } from "../services/savingsGoalService";
import { getBankAccounts } from "../services/bankAccountService";

import { exportFinancialPDF } from "../utils/exportPDF";
import { exportFinancialExcel } from "../utils/exportExcel";

import { useAppSettings } from "../utils/useAppSettings";
import {
  formatMoney,
  formatDateTime,
} from "../utils/settings";

import "../styles/reports.css";

/* =========================================================
   HELPERS
========================================================= */

const num = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const safe = (value) =>
  Array.isArray(value) ? value : [];

const dateOnly = (value, format) => {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "-";

  if (format === "YYYY-MM-DD") {
    return d.toISOString().slice(0, 10);
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  if (format === "MM/DD/YYYY") {
    return `${mm}/${dd}/${yyyy}`;
  }

  return `${dd}/${mm}/${yyyy}`;
};

/* =========================================================
   CHART COLORS
========================================================= */

const CATEGORY_COLORS = [
  "#2563eb", // Blue
  "#f97316", // Orange
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#ec4899", // Pink
];

/* =========================================================
   REPORTS
========================================================= */

function Reports() {
  const settings = useAppSettings();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin = user?.role === "admin";
  const isPro =
    !isAdmin &&
    String(user?.account_tier || "normal").toLowerCase() ===
    "premium";

  const [income, setIncome] = useState([]);
  const [expense, setExpense] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [banks, setBanks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState("all");
  const [type, setType] = useState("all");

  /* =======================================================
     LOAD REPORT DATA
  ======================================================= */

  const load = async () => {
    try {
      setLoading(true);

      const [
        incomeData,
        expenseData,
        budgetData,
        goalData,
        bankData,
      ] = await Promise.all([
        getIncome(),
        getExpense(),
        getBudget(new Date().getFullYear()),
        getSavingsGoals(),
        getBankAccounts(),
      ]);

      setIncome(safe(incomeData));
      setExpense(safe(expenseData));
      setBudgets(safe(budgetData));
      setGoals(safe(goalData));
      setBanks(safe(bankData));
    } catch (error) {
      console.error("Reports loading failed:", error);
      toast.error("Unable to load reports");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    load();

    const refresh = () => {
      load();
    };

    window.addEventListener(
      "bb:data-changed",
      refresh
    );

    return () => {
      window.removeEventListener(
        "bb:data-changed",
        refresh
      );
    };
  }, []);

  /* =======================================================
     ALL TRANSACTIONS
  ======================================================= */

  const all = useMemo(() => {
    return [
      ...income.map((x) => ({
        ...x,
        kind: "Income",
        date:
          x.transaction_date ||
          x.created_at,
      })),

      ...expense.map((x) => ({
        ...x,
        kind: "Expense",
        date:
          x.transaction_date ||
          x.created_at,
      })),
    ];
  }, [income, expense]);

  /* =======================================================
     FILTERED TRANSACTIONS
  ======================================================= */

  const filtered = useMemo(() => {
    const now = Date.now();

    const days =
      range === "30"
        ? 30
        : range === "90"
        ? 90
        : null;

    return all.filter((x) => {
      if (
        type !== "all" &&
        x.kind !== type
      ) {
        return false;
      }

      if (!days || !x.date) {
        return true;
      }

      const timestamp =
        new Date(x.date).getTime();

      if (!Number.isFinite(timestamp)) {
        return false;
      }

      return (
        now - timestamp <=
        days * 86400000
      );
    });
  }, [all, range, type]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totals = useMemo(() => {
    return filtered.reduce(
      (result, transaction) => {
        const value = num(transaction.amount);

        if (transaction.kind === "Income") {
          result.income += value;
        } else {
          result.expense += value;
        }

        return result;
      },
      {
        income: 0,
        expense: 0,
      }
    );
  }, [filtered]);

  /* =======================================================
     CASH FLOW TREND
  ======================================================= */

  const trend = useMemo(() => {
    const map = {};

    filtered.forEach((transaction) => {
      const date = transaction.date
        ? new Date(transaction.date)
        : null;

      if (
        !date ||
        Number.isNaN(date.getTime())
      ) {
        return;
      }

      const key =
        date.toISOString().slice(0, 10);

      if (!map[key]) {
        map[key] = {
          date: key,
          income: 0,
          expense: 0,
        };
      }

      if (transaction.kind === "Income") {
        map[key].income += num(
          transaction.amount
        );
      } else {
        map[key].expense += num(
          transaction.amount
        );
      }
    });

    return Object.values(map)
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      .slice(-30);
  }, [filtered]);

  /* =======================================================
     EXPENSE CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const map = {};

    expense.forEach((transaction) => {
      const category =
        transaction.category || "Other";

      map[category] =
        (map[category] || 0) +
        num(transaction.amount);
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [expense]);

  /* =======================================================
     BUDGET PERFORMANCE
  ======================================================= */

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const category =
        String(
          budget.category || ""
        )
          .trim()
          .toLowerCase();

      const spent = expense
        .filter(
          (transaction) =>
            String(
              transaction.category || ""
            )
              .trim()
              .toLowerCase() === category
        )
        .reduce(
          (sum, transaction) =>
            sum + num(transaction.amount),
          0
        );

      const total = num(
        budget.budget_amount
      );

      return {
        name:
          budget.category ||
          "Budget",

        budget: total,

        spent,

        remaining: Math.max(
          0,
          total - spent
        ),

        pct:
          total > 0
            ? Math.min(
                100,
                (spent / total) * 100
              )
            : 0,
      };
    });
  }, [budgets, expense]);

  /* =======================================================
     SAVINGS
  ======================================================= */

  const saved = goals.reduce(
    (sum, goal) =>
      sum + num(goal.saved_amount),
    0
  );

  const target = goals.reduce(
    (sum, goal) =>
      sum + num(goal.target_amount),
    0
  );

  const budgetTotal = budgets.reduce(
    (sum, budget) =>
      sum + num(budget.budget_amount),
    0
  );

  const savingsPct =
    target > 0
      ? Math.min(
          100,
          (saved / target) * 100
        )
      : 0;

  /* =======================================================
     EXPORT
  ======================================================= */

  const doExcel = () => {
    try {
      exportFinancialExcel(
        income,
        expense,
        banks,
        budgets,
        goals,
        {
          currency: settings.currency,
          currencySymbol: settings.currency,
          dateFormat: settings.dateFormat,
          user,
        }
      );
    } catch (error) {
      console.error(
        "Excel export failed:",
        error
      );

      toast.error(
        "Unable to export Excel report"
      );
    }
  };

  const doPdf = () => {
    try {
      exportFinancialPDF(
        income,
        expense,
        banks,
        budgets,
        goals,
        {
          currency: settings.currency,
          currencySymbol: settings.currency,
          dateFormat: settings.dateFormat,
          user,
        }
      );
    } catch (error) {
      console.error(
        "PDF export failed:",
        error
      );

      toast.error(
        "Unable to export PDF report"
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <Sidebar />
        <Navbar />

        <main className="reports-page">
          <div className="reports-loading">
            <div className="reports-loading-spinner" />

            <h2>
              Building your financial report…
            </h2>

            <p>
              Connecting transactions,
              budgets, savings and banking data.
            </p>
          </div>
        </main>
      </>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Sidebar />
      <Navbar />

      <main className="reports-page">
        <div className="reports-container">

          {/* =================================================
              HERO
          ================================================= */}

          <header className="reports-hero">

            <div>
              <span className="reports-eyebrow">
                BUDGETBUDDY • REPORT CENTER
              </span>

              <div className="reports-title-row">

                <h1>
                  Financial Intelligence
                </h1>

                {isPro && (
                  <span className="reports-pro">
                    <FaCrown />
                    PRO
                  </span>
                )}

              </div>

              <p>
                Professional reporting across
                cash flow, transactions, budgets,
                savings and bank accounts.
              </p>

              <small>
                Generated{" "}
                {formatDateTime(
                  new Date(),
                  settings.dateFormat
                )}
              </small>
            </div>

            <div className="reports-hero-icon">
              <FaChartPie />
            </div>

          </header>

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <section className="reports-toolbar">

            <div>
              <label>
                TIME RANGE
              </label>

              <div className="report-filter-buttons">

                {["all", "30", "90"].map(
                  (value) => (
                    <button
                      key={value}
                      className={
                        range === value
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setRange(value)
                      }
                    >
                      {value === "all"
                        ? "All time"
                        : `${value} days`}
                    </button>
                  )
                )}

              </div>
            </div>

            <div>
              <label>
                TRANSACTION TYPE
              </label>

              <div className="report-filter-buttons">

                {[
                  "all",
                  "Income",
                  "Expense",
                ].map((value) => (
                  <button
                    key={value}
                    className={
                      type === value
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setType(value)
                    }
                  >
                    {value === "all"
                      ? "All"
                      : value}
                  </button>
                ))}

              </div>
            </div>

            {/* EXPORT */}

            <div className="report-export-actions">

              <button
                onClick={doExcel}
                className="excel-export-btn"
                type="button"
              >
                <FaFileExcel />
                Excel
              </button>

              <button
                onClick={doPdf}
                className="pdf-export-btn"
                type="button"
              >
                <FaFilePdf />
                PDF
              </button>

            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="reports-summary">

            <article className="report-card income">

              <span>
                <FaArrowUp />
                INCOME
              </span>

              <strong>
                {formatMoney(
                  totals.income,
                  settings.currency
                )}
              </strong>

              <small>
                Filtered inflow
              </small>

            </article>

            <article className="report-card expense">

              <span>
                <FaArrowDown />
                EXPENSE
              </span>

              <strong>
                {formatMoney(
                  totals.expense,
                  settings.currency
                )}
              </strong>

              <small>
                Filtered outflow
              </small>

            </article>

            <article className="report-card balance">

              <span>
                <FaWallet />
                NET CASH FLOW
              </span>

              <strong>
                {formatMoney(
                  totals.income -
                    totals.expense,
                  settings.currency
                )}
              </strong>

              <small>
                {filtered.length} records in view
              </small>

            </article>

            <article className="report-card savings">

              <span>
                <FaPiggyBank />
                SAVINGS
              </span>

              <strong>
                {savingsPct.toFixed(0)}%
              </strong>

              <small>
                {formatMoney(
                  saved,
                  settings.currency
                )}{" "}
                /{" "}
                {formatMoney(
                  target,
                  settings.currency
                )}
              </small>

            </article>

          </section>

          {/* =================================================
              KPI STRIP
          ================================================= */}

          <section className="reports-kpi-strip">

            <div>
              <span>
                BUDGET ENVELOPE
              </span>

              <strong>
                {formatMoney(
                  budgetTotal,
                  settings.currency
                )}
              </strong>
            </div>

            <div>
              <span>
                BUDGETS
              </span>

              <strong>
                {budgets.length}
              </strong>
            </div>

            <div>
              <span>
                SAVINGS GOALS
              </span>

              <strong>
                {goals.length}
              </strong>
            </div>

            <div>
              <span>
                BANK ACCOUNTS
              </span>

              <strong>
                {banks.length}
              </strong>
            </div>

          </section>

          {/* =================================================
              CASH FLOW + CATEGORY
          ================================================= */}

          <section className="reports-chart-grid">

            {/* CASH FLOW */}

            <article className="reports-panel wide">

              <div className="panel-head">

                <div>
                  <span>
                    CASH FLOW SIGNAL
                  </span>

                  <h2>
                    Income vs Expense Trend
                  </h2>
                </div>

                <FaChartPie />

              </div>

              <div className="report-chart">

                {trend.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={trend}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 5,
                        bottom: 5,
                      }}
                    >

                      <defs>

                        {/* INCOME GRADIENT */}

                        <linearGradient
                          id="incomeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity={0.28}
                          />

                          <stop
                            offset="100%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        {/* EXPENSE GRADIENT */}

                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity={0.24}
                          />

                          <stop
                            offset="100%"
                            stopColor="#ef4444"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                        tick={{
                          fontSize: 11,
                          fill: "#64748b",
                        }}
                        axisLine={{
                          stroke: "#cbd5e1",
                        }}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={(value) =>
                          `${Math.round(
                            value / 1000
                          )}k`
                        }
                        tick={{
                          fontSize: 11,
                          fill: "#64748b",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(
                          value,
                          name
                        ) => [
                          formatMoney(
                            value,
                            settings.currency
                          ),
                          name,
                        ]}
                        contentStyle={{
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "12px",
                          boxShadow:
                            "0 10px 30px rgba(15,23,42,0.12)",
                        }}
                        labelStyle={{
                          color: "#0f172a",
                          fontWeight: 700,
                        }}
                      />

                      <Legend />

                      {/* INCOME */}

                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#incomeGradient)"
                        dot={{
                          r: 3,
                          fill: "#10b981",
                          stroke:
                            "#ffffff",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />

                      {/* EXPENSE */}

                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#expenseGradient)"
                        dot={{
                          r: 3,
                          fill: "#ef4444",
                          stroke:
                            "#ffffff",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />

                    </AreaChart>
                  </ResponsiveContainer>

                ) : (

                  <div className="report-empty">
                    No transaction data available
                    for the selected range.
                  </div>

                )}

              </div>

            </article>

            {/* TOP CATEGORIES */}

            <article className="reports-panel">

              <div className="panel-head">

                <div>
                  <span>
                    SPENDING MIX
                  </span>

                  <h2>
                    Top Categories
                  </h2>
                </div>

              </div>

              <div className="report-pie">

                {categories.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>

                      <Pie
                        data={categories}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={4}
                        cornerRadius={6}
                      >

                        {categories.map(
                          (item, index) => (
                            <Cell
                              key={
                                `${item.name}-${index}`
                              }
                              fill={
                                CATEGORY_COLORS[
                                  index %
                                    CATEGORY_COLORS.length
                                ]
                              }
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatMoney(
                            value,
                            settings.currency
                          )
                        }
                        contentStyle={{
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "12px",
                          boxShadow:
                            "0 10px 30px rgba(15,23,42,0.12)",
                        }}
                      />

                    </PieChart>
                  </ResponsiveContainer>

                ) : (

                  <div className="report-empty">
                    No expense categories yet.
                  </div>

                )}

              </div>

              <div className="report-category-list">

                {categories
                  .slice(0, 5)
                  .map((item, index) => (

                    <div
                      key={item.name}
                      className="category-row"
                    >

                      <span className="category-name">

                        <i
                          style={{
                            display:
                              "inline-block",
                            width: "9px",
                            height: "9px",
                            borderRadius:
                              "50%",
                            background:
                              CATEGORY_COLORS[
                                index %
                                  CATEGORY_COLORS.length
                              ],
                            marginRight:
                              "8px",
                          }}
                        />

                        {item.name}

                      </span>

                      <b>
                        {formatMoney(
                          item.value,
                          settings.currency
                        )}
                      </b>

                    </div>

                  ))}

              </div>

            </article>

          </section>

          {/* =================================================
              BUDGET PERFORMANCE
          ================================================= */}

          <section className="reports-panel report-budget-chart">

            <div className="panel-head">

              <div>
                <span>
                  BUDGET PERFORMANCE
                </span>

                <h2>
                  Budget vs Actual by Category
                </h2>
              </div>

              <span className="panel-note">
                Each budget is analysed independently
              </span>

            </div>

            {budgetData.length ? (

              <div className="report-chart budget-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={budgetData}
                    margin={{
                      top: 15,
                      right: 25,
                      left: 5,
                      bottom: 10,
                    }}
                    barGap={8}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 12,
                        fill: "#475569",
                      }}
                      axisLine={{
                        stroke: "#cbd5e1",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "#64748b",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        formatMoney(
                          value,
                          settings.currency
                        )
                      }
                    />

                    <Tooltip
                      formatter={(
                        value,
                        name
                      ) => [
                        formatMoney(
                          value,
                          settings.currency
                        ),
                        name,
                      ]}
                      contentStyle={{
                        background:
                          "#ffffff",
                        border:
                          "1px solid #e2e8f0",
                        borderRadius:
                          "12px",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.12)",
                      }}
                      labelStyle={{
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    />

                    <Legend />

                    {/* BUDGET = BLUE */}

                    <Bar
                      dataKey="budget"
                      name="Budget"
                      fill="#2563eb"
                      radius={[
                        7,
                        7,
                        0,
                        0,
                      ]}
                      barSize={34}
                    />

                    {/* SPENT = ORANGE */}

                    <Bar
                      dataKey="spent"
                      name="Spent"
                      fill="#f97316"
                      radius={[
                        7,
                        7,
                        0,
                        0,
                      ]}
                      barSize={34}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            ) : (

              <div className="report-empty">
                No budgets configured for this year.
              </div>

            )}

          </section>

          {/* =================================================
              TRANSACTION DETAIL + PRO
          ================================================= */}

          <section className="reports-detail-grid">

            {/* TRANSACTION DETAIL */}

            <article className="reports-panel">

              <div className="panel-head">

                <div>
                  <span>
                    TRANSACTION DETAIL
                  </span>

                  <h2>
                    Recent records
                  </h2>
                </div>

                <FaCalendarAlt />

              </div>

              <div className="report-table-wrap">

                <table>

                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Payment Method</th>
                      <th>Description</th>
                      <th className="amount-col">Amount</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filtered
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date) -
                          new Date(a.date)
                      )
                      .slice(0, 12)
                      .map((transaction) => (

                        <tr
                          key={`${transaction.kind}-${transaction.id}`}
                        >

                          <td>
                            {dateOnly(
                              transaction.date,
                              settings.dateFormat
                            )}
                          </td>

                          <td>

                            <span
                              className={`type-pill ${transaction.kind.toLowerCase()}`}
                            >
                              {transaction.kind}
                            </span>

                          </td>

                          <td>
                            {transaction.category ||
                              "Other"}
                          </td>

                          <td>
                            {transaction.payment_method || "Bank"}
                          </td>

                          <td>
                            {transaction.description ||
                              "—"}
                          </td>

                          <td
                            className={
                              transaction.kind ===
                              "Income"
                                ? "positive amount-col"
                                : "negative amount-col"
                            }
                          >

                            {transaction.kind ===
                            "Income"
                              ? "+"
                              : "-"}

                            {formatMoney(
                              transaction.amount,
                              settings.currency
                            )}

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            </article>

            {/* CUSTOMER PLAN CAPABILITY */}

            {!isAdmin && <article className="reports-panel">

              <div className="panel-head">

                <div>
                  <span>
                    PRO CAPABILITY
                  </span>

                  <h2>
                    {isPro
                      ? "Advanced mode active"
                      : "Normal plan"}
                  </h2>
                </div>

                {isPro && <FaCrown />}

              </div>

              {isPro ? (

                <div className="capability-list">

                  <div>
                    ✓ Advanced dashboard
                    intelligence
                  </div>

                  <div>
                    ✓ Deeper visual analytics
                  </div>

                  <div>
                    ✓ Individual budget &
                    goal signals
                  </div>

                  <div>
                    ✓ Executive-ready reporting
                  </div>

                </div>

              ) : (

                <div className="normal-plan-card">

                  <p>
                    Core reporting is available.
                    Pro adds deeper financial
                    intelligence and advanced
                    decision signals without
                    changing your existing data.
                  </p>

                  <strong>
                    PRO includes
                  </strong>

                  <span>
                    • Advanced analytics
                  </span>

                  <span>
                    • More detailed insights
                  </span>

                  <span>
                    • Executive reporting view
                  </span>

                </div>

              )}

            </article>}

          </section>

          <Footer />

        </div>
      </main>
    </>
  );
}

export default Reports;