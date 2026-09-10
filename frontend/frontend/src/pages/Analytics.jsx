import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";

import BarChartCard from "../components/BarChartCard";
import DailyTrendChart from "../components/DailyTrendChart";
import BankAnalysisChart from "../components/BankAnalysisChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import PieChartCard from "../components/PieChartCard";

import {
    getMonthlyAnalysis,
    getYearlyAnalysis,
} from "../services/analyticsService";

import { getBankAccounts } from "../services/bankAccountService";
import { useAuth } from "../context/AuthContext";

import "../styles/analytics.css";
import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney } from "../utils/settings";

const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

const YEAR_OPTIONS = [
    CURRENT_YEAR - 1,
    CURRENT_YEAR,
    CURRENT_YEAR + 1,
];

const money = (value, currency) => formatMoney(value, currency);


/* =========================================================
   DONUT CHART
   ========================================================= */

function CashFlowDonut({ income, expense, savings }) {

    const donutData = [
        {
            name: "Income",
            value: Math.max(Number(income || 0), 0),
        },
        {
            name: "Expense",
            value: Math.max(Number(expense || 0), 0),
        },
    ].filter((item) => item.value > 0);

    const COLORS = ["#635BFF", "#FF5C7A"];

    if (!donutData.length) {
        return (
            <div className="analytics-donut-empty">
                <div className="analytics-donut-empty-icon">
                    📊
                </div>

                <strong>No financial data</strong>

                <span>
                    Add income or expenses to see your cash-flow analysis.
                </span>
            </div>
        );
    }

    return (
        <div className="analytics-donut-wrapper">

            <ResponsiveContainer width="100%" height={290}>

                <PieChart>

                    <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={82}
                        outerRadius={112}
                        paddingAngle={4}
                        cornerRadius={8}
                        stroke="none"
                    >

                        {donutData.map((entry, index) => (
                            <Cell
                                key={`donut-${entry.name}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}

                    </Pie>

                    <Tooltip
                        formatter={(value) => money(value, currency)}
                        contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow:
                                "0 10px 30px rgba(15,23,42,.12)",
                        }}
                    />

                </PieChart>

            </ResponsiveContainer>

            <div className="analytics-donut-center">

                <span>NET SAVINGS</span>

                <strong
                    className={
                        Number(savings) < 0
                            ? "negative"
                            : ""
                    }
                >
                    {money(savings, currency)}
                </strong>

                <small>
                    {Number(savings) < 0
                        ? "Deficit"
                        : "Available after expenses"}
                </small>

            </div>

            <div className="analytics-donut-legend">

                <div>
                    <span className="legend-dot income-dot" />

                    <div>
                        <small>Income</small>
                        <strong>{money(income, currency)}</strong>
                    </div>
                </div>

                <div>
                    <span className="legend-dot expense-dot" />

                    <div>
                        <small>Expense</small>
                        <strong>{money(expense, currency)}</strong>
                    </div>
                </div>

            </div>

        </div>
    );
}


/* =========================================================
   KPI CARD
   ========================================================= */

function AnalyticsKpi({
    icon,
    label,
    value,
    subtitle,
    type = "purple",
}) {
    return (
        <div className={`analytics-kpi analytics-kpi-${type}`}>

            <div className="analytics-kpi-top">

                <div className="analytics-kpi-icon">
                    {icon}
                </div>

                <span className="analytics-kpi-label">
                    {label}
                </span>

            </div>

            <strong className="analytics-kpi-value">
                {value}
            </strong>

            {subtitle && (
                <span className="analytics-kpi-subtitle">
                    {subtitle}
                </span>
            )}

        </div>
    );
}


/* =========================================================
   FILTER PANEL
   ========================================================= */

function AnalyticsFilters({
    viewMode,
    year,
    setYear,
    month,
    setMonth,
    bankId,
    setBankId,
    category,
    setCategory,
    bankAccounts,
    availableCategories,
}) {
    return (
        <div className="analytics-filter-panel">

            <div className="analytics-filter-heading">

                <div className="analytics-filter-icon">
                    ⚙️
                </div>

                <div>
                    <strong>Analysis Filters</strong>

                    <span>
                        Customize the period and financial data
                    </span>
                </div>

            </div>

            <div className="analytics-filter-grid">

                <div className="analytics-filter-field">

                    <label>YEAR</label>

                    <select
                        value={year}
                        onChange={(e) =>
                            setYear(Number(e.target.value))
                        }
                    >
                        {YEAR_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                </div>


                {viewMode === "monthly" && (

                    <div className="analytics-filter-field">

                        <label>MONTH</label>

                        <select
                            value={month}
                            onChange={(e) =>
                                setMonth(Number(e.target.value))
                            }
                        >
                            {MONTH_NAMES.map((name, index) => (
                                <option
                                    key={name}
                                    value={index + 1}
                                >
                                    {name}
                                </option>
                            ))}
                        </select>

                    </div>

                )}


                <div className="analytics-filter-field">

                    <label>BANK</label>

                    <select
                        value={bankId}
                        onChange={(e) =>
                            setBankId(e.target.value)
                        }
                    >
                        <option value="">
                            All Banks
                        </option>

                        {bankAccounts.map((bank) => (
                            <option
                                key={bank.id}
                                value={bank.id}
                            >
                                {bank.bank_name}
                            </option>
                        ))}
                    </select>

                </div>


                <div className="analytics-filter-field">

                    <label>CATEGORY</label>

                    <select
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value)
                        }
                    >
                        <option value="">
                            All Categories
                        </option>

                        {availableCategories.map((item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        ))}
                    </select>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   MAIN ANALYTICS
   ========================================================= */

function Analytics() {

    const [viewMode, setViewMode] = useState("monthly");

    const [year, setYear] = useState(CURRENT_YEAR);

    const [month, setMonth] = useState(CURRENT_MONTH);

    const [bankId, setBankId] = useState("");

    const [category, setCategory] = useState("");

    const { user, isAdmin } = useAuth();
    const settings = useAppSettings();
    const currency = settings?.currency || "INR";
    const isPremium = isAdmin || user?.account_tier === "premium";

    const [bankAccounts, setBankAccounts] = useState([]);

    const [monthlyData, setMonthlyData] = useState(null);

    const [yearlyData, setYearlyData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(false);


    useEffect(() => {

        getBankAccounts()
            .then(setBankAccounts)
            .catch(() => {});

    }, []);


    useEffect(() => {

        loadAnalytics();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        viewMode,
        year,
        month,
        bankId,
        category,
    ]);


    const loadAnalytics = async () => {

        setLoading(true);

        setError(false);

        try {

            if (viewMode === "monthly") {

                const result =
                    await getMonthlyAnalysis(
                        year,
                        month,
                        bankId || null,
                        category || null
                    );

                setMonthlyData(result);

            } else if (isPremium) {

                const result =
                    await getYearlyAnalysis(
                        year,
                        bankId || null,
                        category || null
                    );

                setYearlyData(result);

            } else {
                // Yearly/trend analysis is Premium-gated on the backend
                // (require_premium_user -> 403 for Normal accounts). Skip
                // the call entirely and show the upgrade prompt instead.
                setYearlyData(null);
            }

        } catch (err) {

            console.error(err);

            setError(true);

            setMonthlyData(null);

            setYearlyData(null);

        } finally {

            setLoading(false);

        }
    };


    const data =
        viewMode === "monthly"
            ? monthlyData
            : yearlyData;


    const availableCategories = useMemo(() => {

        if (!data) return [];

        return Array.from(
            new Set([
                ...(data.income_by_category || []).map(
                    (item) => item.category
                ),

                ...(data.expense_by_category || []).map(
                    (item) => item.category
                ),
            ])
        );

    }, [data]);


    const periodLabel =
        viewMode === "monthly"
            ? `${MONTH_NAMES[month - 1]} ${year}`
            : `${year}`;


    return (
        <>

            <Sidebar />

            <Navbar />


            <main className="bb-analytics-page">

                {/* =====================================================
                    HERO
                ===================================================== */}

                <section className="analytics-hero">

                    <div>

                        <span className="analytics-eyebrow">
                            FINANCIAL INTELLIGENCE
                        </span>

                        <h1>
                            Financial Analytics
                        </h1>

                        <p>
                            Understand your money, discover patterns,
                            and make smarter financial decisions.
                        </p>

                    </div>


                    <div className="analytics-hero-right">

                        <div className="analytics-period-icon">
                            📈
                        </div>

                        <div>
                            <span>VIEWING</span>

                            <strong>
                                {periodLabel}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    VIEW SWITCH
                ===================================================== */}

                <div className="analytics-view-row">

                    <div className="analytics-view-switch">

                        <button
                            className={
                                viewMode === "monthly"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode("monthly")
                            }
                        >
                            <span>◷</span>
                            Monthly
                        </button>

                        <button
                            className={
                                viewMode === "yearly"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode("yearly")
                            }
                        >
                            <span>◉</span>
                            Yearly
                        </button>

                    </div>

                </div>


                {/* =====================================================
                    FILTERS
                ===================================================== */}

                <AnalyticsFilters
                    viewMode={viewMode}
                    year={year}
                    setYear={setYear}
                    month={month}
                    setMonth={setMonth}
                    bankId={bankId}
                    setBankId={setBankId}
                    category={category}
                    setCategory={setCategory}
                    bankAccounts={bankAccounts}
                    availableCategories={availableCategories}
                />


                {loading && (

                    <div className="analytics-loading">

                        <LoadingSpinner />

                        <span>
                            Analysing your financial data...
                        </span>

                    </div>

                )}


                {!loading && error && (

                    <div className="analytics-error">

                        <span>⚠️</span>

                        <div>

                            <strong>
                                Unable to load analytics
                            </strong>

                            <p>
                                Something went wrong while
                                loading {periodLabel}.
                            </p>

                        </div>

                        <button onClick={loadAnalytics}>
                            Try Again
                        </button>

                    </div>

                )}


                {!loading && !error && viewMode === "yearly" && !isPremium && (

                    <div className="analytics-error" style={{ background: "#fff8e6", borderColor: "#f0c14b" }}>

                        <span>🔒</span>

                        <div>
                            <strong>Premium Feature</strong>
                            <p>
                                Yearly trends, category trends, and deeper
                                historical analysis are part of Advanced
                                Financial Intelligence. Upgrade to Premium
                                to unlock this view.
                            </p>
                        </div>

                        <a href="/profile" className="btn btn-sm btn-warning">
                            Upgrade to Premium
                        </a>

                    </div>

                )}


                {!loading &&
                    !error &&
                    data && (

                        viewMode === "monthly"

                            ? (
                                <MonthlyView
                                    data={monthlyData}
                                    periodLabel={periodLabel}
                                />
                            )

                            : (
                                <YearlyView
                                    data={yearlyData}
                                    periodLabel={periodLabel}
                                    bankId={bankId}
                                    category={category}
                                />
                            )

                    )}


                <Footer />

            </main>

        </>
    );
}


/* =========================================================
   MONTHLY VIEW
   ========================================================= */

function MonthlyView({
    data,
    periodLabel,
}) {

    const highestExpense =
        data.expense_by_category?.length
            ? data.expense_by_category[0]
            : null;

    const highestIncome =
        data.income_by_category?.length
            ? data.income_by_category[0]
            : null;


    const totalIncome =
        Number(data.total_income || 0);

    const totalExpense =
        Number(data.total_expense || 0);

    const savings =
        Number(data.savings || 0);


    return (
        <>

            {/* =====================================================
                KPI SECTION
            ===================================================== */}

            <section className="analytics-kpi-grid">

                <AnalyticsKpi
                    icon="💰"
                    label="MONTHLY INCOME"
                    value={money(totalIncome, currency)}
                    subtitle="Money received"
                    type="income"
                />

                <AnalyticsKpi
                    icon="💳"
                    label="MONTHLY EXPENSE"
                    value={money(totalExpense, currency)}
                    subtitle="Money spent"
                    type="expense"
                />

                <AnalyticsKpi
                    icon="✨"
                    label="NET SAVINGS"
                    value={money(savings, currency)}
                    subtitle={
                        data.savings_percentage !== null
                            ? `${data.savings_percentage}% savings rate`
                            : "After expenses"
                    }
                    type={
                        savings < 0
                            ? "expense"
                            : "savings"
                    }
                />

                <AnalyticsKpi
                    icon="🎯"
                    label="BUDGET REMAINING"
                    value={money(data.budget.remaining, currency)}
                    subtitle={
                        data.budget.is_over_budget
                            ? "Over budget"
                            : `${data.budget.percent_used}% used`
                    }
                    type={
                        data.budget.remaining < 0
                            ? "expense"
                            : "budget"
                    }
                />

            </section>


            {/* =====================================================
                DONUT + INSIGHTS
            ===================================================== */}

            <section className="analytics-feature-grid">

                <div className="analytics-panel analytics-donut-card">

                    <div className="analytics-panel-heading">

                        <div>

                            <span>
                                CASH FLOW
                            </span>

                            <h3>
                                Income vs Expense
                            </h3>

                        </div>

                        <div className="panel-mini-icon">
                            ◔
                        </div>

                    </div>

                    <CashFlowDonut
                        income={totalIncome}
                        expense={totalExpense}
                        savings={savings}
                    />

                </div>


                <div className="analytics-panel analytics-insights-card">

                    <div className="analytics-panel-heading">

                        <div>

                            <span>
                                SMART INSIGHTS
                            </span>

                            <h3>
                                Your Money Story
                            </h3>

                        </div>

                        <div className="panel-mini-icon">
                            ✨
                        </div>

                    </div>


                    <div className="analytics-insight-list">

                        <div className="analytics-insight">

                            <div className="insight-icon purple">
                                💸
                            </div>

                            <div>

                                <span>
                                    TOP EXPENSE
                                </span>

                                <strong>
                                    {highestExpense
                                        ? highestExpense.category
                                        : "No data"}
                                </strong>

                                {highestExpense && (
                                    <small>
                                        {money(
                                            highestExpense.amount
                                        )}
                                    </small>
                                )}

                            </div>

                        </div>


                        <div className="analytics-insight">

                            <div className="insight-icon green">
                                💰
                            </div>

                            <div>

                                <span>
                                    TOP INCOME
                                </span>

                                <strong>
                                    {highestIncome
                                        ? highestIncome.category
                                        : "No data"}
                                </strong>

                                {highestIncome && (
                                    <small>
                                        {money(
                                            highestIncome.amount
                                        )}
                                    </small>
                                )}

                            </div>

                        </div>


                        <div className="analytics-insight">

                            <div className="insight-icon blue">
                                🎯
                            </div>

                            <div>

                                <span>
                                    BUDGET STATUS
                                </span>

                                <strong>
                                    {data.budget.is_over_budget
                                        ? "Over Budget"
                                        : "Within Budget"}
                                </strong>

                                <small>
                                    {money(
                                        data.budget.remaining
                                    )} remaining
                                </small>

                            </div>

                        </div>


                        <div className="analytics-insight">

                            <div className="insight-icon orange">
                                📊
                            </div>

                            <div>

                                <span>
                                    TRANSACTIONS
                                </span>

                                <strong>
                                    {(
                                        data.income_by_category
                                            ?.length || 0
                                    ) +
                                        (
                                            data.expense_by_category
                                                ?.length || 0
                                        )}
                                    {" "}categories
                                </strong>

                                <small>
                                    {periodLabel}
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                BUDGET STATUS
            ===================================================== */}

            <section className="analytics-budget-strip">

                <div className="budget-strip-icon">
                    🎯
                </div>

                <div className="budget-strip-info">

                    <div>

                        <span>
                            MONTHLY BUDGET
                        </span>

                        <strong>
                            {money(
                                data.budget.monthly_budget
                            )}
                        </strong>

                    </div>

                    <div>

                        <span>
                            USED
                        </span>

                        <strong>
                            {money(data.budget.spent, currency)}
                        </strong>

                    </div>

                    <div>

                        <span>
                            REMAINING
                        </span>

                        <strong
                            className={
                                data.budget.remaining < 0
                                    ? "danger"
                                    : "success"
                            }
                        >
                            {money(
                                data.budget.remaining
                            )}
                        </strong>

                    </div>

                </div>


                <div className="budget-progress">

                    <div className="budget-progress-top">

                        <span>
                            Budget utilization
                        </span>

                        <strong>
                            {data.budget.percent_used}%
                        </strong>

                    </div>

                    <div className="budget-progress-track">

                        <div
                            className={
                                data.budget.is_over_budget
                                    ? "danger"
                                    : ""
                            }
                            style={{
                                width: `${Math.min(
                                    Number(
                                        data.budget.percent_used || 0
                                    ),
                                    100
                                )}%`,
                            }}
                        />

                    </div>

                </div>

            </section>


            {/* =====================================================
                EXISTING CHARTS
            ===================================================== */}

            {totalIncome === 0 &&
            totalExpense === 0 ? (

                <div className="analytics-empty">

                    <div>
                        📊
                    </div>

                    <h3>
                        No transactions yet
                    </h3>

                    <p>
                        Add income or expenses to unlock
                        your financial analytics.
                    </p>

                </div>

            ) : (

                <>

                    <div className="analytics-chart-grid">

                        <div className="analytics-chart-card">

                            <BarChartCard
                                title="Income vs Expense"
                                data={[
                                    {
                                        name: "Income",
                                        amount: totalIncome,
                                    },
                                    {
                                        name: "Expense",
                                        amount: totalExpense,
                                    },
                                    {
                                        name: "Savings",
                                        amount: savings,
                                    },
                                ]}
                            />

                        </div>


                        <div className="analytics-chart-card">

                            <DailyTrendChart
                                data={data.daily_trend}
                            />

                        </div>

                    </div>


                    <div className="analytics-chart-grid">

                        <div className="analytics-chart-card">

                            <PieChartCard
                                title="Expense by Category"
                                data={
                                    data.expense_by_category.map(
                                        (item) => ({
                                            name: item.category,
                                            amount: item.amount,
                                        })
                                    )
                                }
                            />

                        </div>


                        <div className="analytics-chart-card">

                            <PieChartCard
                                title="Income by Category"
                                data={
                                    data.income_by_category.map(
                                        (item) => ({
                                            name: item.category,
                                            amount: item.amount,
                                        })
                                    )
                                }
                            />

                        </div>

                    </div>


                    <div className="analytics-chart-full">

                        <BankAnalysisChart
                            data={data.bank_analysis}
                        />

                    </div>

                </>

            )}

        </>
    );
}


/* =========================================================
   YEAR OVER YEAR
   ========================================================= */

function YoYBadge({
    label,
    changePercent,
}) {

    if (
        changePercent === null ||
        changePercent === undefined
    ) {
        return (
            <div className="yoy-item">

                <span>{label}</span>

                <strong className="muted">
                    N/A
                </strong>

            </div>
        );
    }

    const positive =
        Number(changePercent) >= 0;

    return (
        <div className="yoy-item">

            <span>{label}</span>

            <strong
                className={
                    positive
                        ? "success"
                        : "danger"
                }
            >
                {positive ? "▲" : "▼"}{" "}
                {Math.abs(changePercent)}%
            </strong>

        </div>
    );
}


/* =========================================================
   YEARLY VIEW
   ========================================================= */

function YearlyView({
    data,
    periodLabel,
    bankId,
    category,
}) {

    const totalIncome =
        Number(data.total_income || 0);

    const totalExpense =
        Number(data.total_expense || 0);

    const savings =
        Number(data.savings || 0);

    const hasData =
        totalIncome > 0 ||
        totalExpense > 0;


    return (
        <>

            <section className="analytics-kpi-grid">

                <AnalyticsKpi
                    icon="💰"
                    label="YEARLY INCOME"
                    value={money(totalIncome, currency)}
                    subtitle="Total received"
                    type="income"
                />

                <AnalyticsKpi
                    icon="💳"
                    label="YEARLY EXPENSE"
                    value={money(totalExpense, currency)}
                    subtitle="Total spent"
                    type="expense"
                />

                <AnalyticsKpi
                    icon="✨"
                    label="YEARLY SAVINGS"
                    value={money(savings, currency)}
                    subtitle={
                        data.savings_percentage !== null
                            ? `${data.savings_percentage}% savings rate`
                            : "Net savings"
                    }
                    type={
                        savings < 0
                            ? "expense"
                            : "savings"
                    }
                />

                <AnalyticsKpi
                    icon="🎯"
                    label="YEARLY BUDGET"
                    value={money(
                        data.budget.yearly_budget
                    )}
                    subtitle={
                        `${data.budget.percent_used}% used`
                    }
                    type="budget"
                />

            </section>


            <section className="analytics-feature-grid">

                <div className="analytics-panel analytics-donut-card">

                    <div className="analytics-panel-heading">

                        <div>

                            <span>
                                YEARLY CASH FLOW
                            </span>

                            <h3>
                                Income vs Expense
                            </h3>

                        </div>

                        <div className="panel-mini-icon">
                            ◔
                        </div>

                    </div>

                    <CashFlowDonut
                        income={totalIncome}
                        expense={totalExpense}
                        savings={savings}
                    />

                </div>


                <div className="analytics-panel">

                    <div className="analytics-panel-heading">

                        <div>

                            <span>
                                YEAR OVER YEAR
                            </span>

                            <h3>
                                Performance
                            </h3>

                        </div>

                        <div className="panel-mini-icon">
                            📈
                        </div>

                    </div>


                    {data.year_over_year ? (

                        <div className="yoy-grid">

                            <YoYBadge
                                label="Income"
                                changePercent={
                                    data.year_over_year
                                        .income_change_percent
                                }
                            />

                            <YoYBadge
                                label="Expense"
                                changePercent={
                                    data.year_over_year
                                        .expense_change_percent
                                }
                            />

                            <YoYBadge
                                label="Savings"
                                changePercent={
                                    data.year_over_year
                                        .savings_change_percent
                                }
                            />

                            <div className="yoy-previous">

                                Compared with{" "}
                                <strong>
                                    {
                                        data.year_over_year
                                            .previous_year
                                    }
                                </strong>
                            </div>

                        </div>

                    ) : (

                        <div className="analytics-no-yoy">

                            <span>
                                📊
                            </span>

                            <p>
                                Previous-year data is not
                                available yet.
                            </p>

                        </div>

                    )}

                </div>

            </section>


            {!hasData ? (

                <div className="analytics-empty">

                    <div>📊</div>

                    <h3>
                        No transactions for {periodLabel}
                    </h3>

                    <p>
                        Add financial activity to see
                        your yearly analysis.
                    </p>

                </div>

            ) : (

                <>

                    <div className="analytics-chart-grid">

                        <div className="analytics-chart-card">

                            <MonthlyBarChart
                                title="Monthly Income vs Expense"
                                data={
                                    data.monthly_breakdown
                                }
                                bars={[
                                    {
                                        dataKey: "income",
                                        name: "Income",
                                        color: "#22C55E",
                                    },
                                    {
                                        dataKey: "expense",
                                        name: "Expense",
                                        color: "#EF4444",
                                    },
                                ]}
                            />

                        </div>


                        <div className="analytics-chart-card">

                            <MonthlyBarChart
                                title="Monthly Savings Trend"
                                data={
                                    data.monthly_breakdown
                                }
                                bars={[
                                    {
                                        dataKey: "savings",
                                        name: "Savings",
                                        color: "#635BFF",
                                    },
                                ]}
                            />

                        </div>

                    </div>


                    <div className="analytics-chart-grid">

                        <div className="analytics-chart-card">

                            <MonthlyBarChart
                                title="Monthly Budget vs Actual"
                                data={
                                    data.monthly_breakdown
                                }
                                bars={[
                                    {
                                        dataKey: "budget",
                                        name: "Budget",
                                        color: "#94A3B8",
                                    },
                                    {
                                        dataKey: "budget_used",
                                        name: "Used",
                                        color: "#EF4444",
                                    },
                                ]}
                            />

                        </div>


                        <div className="analytics-chart-card">

                            <BankAnalysisChart
                                data={data.bank_analysis}
                                title="Bank-wise Analysis"
                            />

                        </div>

                    </div>


                    <div className="analytics-chart-grid">

                        <div className="analytics-chart-card">

                            <PieChartCard
                                title="Expense by Category"
                                data={
                                    data.expense_by_category.map(
                                        (item) => ({
                                            name: item.category,
                                            amount: item.amount,
                                        })
                                    )
                                }
                            />

                        </div>


                        <div className="analytics-chart-card">

                            <PieChartCard
                                title="Income by Category"
                                data={
                                    data.income_by_category.map(
                                        (item) => ({
                                            name: item.category,
                                            amount: item.amount,
                                        })
                                    )
                                }
                            />

                        </div>

                    </div>


                    <div className="analytics-table-card">

                        <div className="analytics-table-heading">

                            <div>

                                <span>
                                    YEARLY BREAKDOWN
                                </span>

                                <h3>
                                    12-Month Summary
                                </h3>

                            </div>

                        </div>


                        <div className="table-responsive">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Month</th>
                                        <th>Income</th>
                                        <th>Expense</th>
                                        <th>Savings</th>
                                        <th>Budget</th>
                                        <th>Used</th>
                                        <th>Remaining</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {data.monthly_breakdown.map(
                                        (item) => {

                                            const negative =
                                                item.savings < 0;

                                            const overBudget =
                                                item.budget > 0 &&
                                                item.budget_used >
                                                    item.budget;

                                            const highestExpense =
                                                data.highest_expense_month &&
                                                item.month ===
                                                    data
                                                        .highest_expense_month
                                                        .month;

                                            const highestSavings =
                                                data.highest_savings_month &&
                                                item.month ===
                                                    data
                                                        .highest_savings_month
                                                        .month;

                                            return (
                                                <tr
                                                    key={
                                                        item.month
                                                    }
                                                    className={
                                                        negative
                                                            ? "negative-row"
                                                            : overBudget
                                                            ? "warning-row"
                                                            : ""
                                                    }
                                                >

                                                    <td>

                                                        <strong>
                                                            {
                                                                item.month_name
                                                            }
                                                        </strong>

                                                        {highestExpense && (
                                                            <span className="table-badge expense-badge">
                                                                Highest Expense
                                                            </span>
                                                        )}

                                                        {highestSavings && (
                                                            <span className="table-badge savings-badge">
                                                                Highest Savings
                                                            </span>
                                                        )}

                                                    </td>

                                                    <td className="income-text">
                                                        {money(
                                                            item.income
                                                        )}
                                                    </td>

                                                    <td className="expense-text">
                                                        {money(
                                                            item.expense
                                                        )}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item.savings
                                                        )}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item.budget
                                                        )}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item.budget_used
                                                        )}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item.budget_remaining
                                                        )}
                                                    </td>

                                                </tr>
                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

        </>
    );
}


export default Analytics;