import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaWallet,
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaCopy,
  FaMagic,
  FaCalculator,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  addBudget,
  getBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";

import { toast } from "../utils/notifications";
import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney, getCurrencyMeta, convertCurrency, convertToINR } from "../utils/settings";

import "../styles/budget.css";

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS = [
  { number: 1, short: "Jan", full: "January" },
  { number: 2, short: "Feb", full: "February" },
  { number: 3, short: "Mar", full: "March" },
  { number: 4, short: "Apr", full: "April" },
  { number: 5, short: "May", full: "May" },
  { number: 6, short: "Jun", full: "June" },
  { number: 7, short: "Jul", full: "July" },
  { number: 8, short: "Aug", full: "August" },
  { number: 9, short: "Sep", full: "September" },
  { number: 10, short: "Oct", full: "October" },
  { number: 11, short: "Nov", full: "November" },
  { number: 12, short: "Dec", full: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();

const YEARS = Array.from(
  { length: 9 },
  (_, index) => CURRENT_YEAR - 4 + index
);

/* =========================================================
   HELPERS
========================================================= */

const num = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const normalizeCategory = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const createAutomaticAllocations = (annualAmount) => {
  const annual = Number(annualAmount);

  if (!Number.isFinite(annual) || annual <= 0) {
    return MONTHS.map((month) => ({
      month: month.number,
      allocated_amount: 0,
    }));
  }

  const cents = Math.round(annual * 100);
  const baseCents = Math.floor(cents / 12);

  let remainder = cents - baseCents * 12;

  return MONTHS.map((month) => {
    let value = baseCents;

    if (remainder > 0) {
      value += 1;
      remainder -= 1;
    }

    return {
      month: month.number,
      allocated_amount: value / 100,
    };
  });
};

const normalizeAllocations = (budget, annualAmount) => {
  const possible =
    budget?.monthly_allocations ||
    budget?.monthlyAllocations ||
    budget?.allocations ||
    [];

  if (!Array.isArray(possible) || possible.length !== 12) {
    return createAutomaticAllocations(annualAmount);
  }

  const map = {};

  possible.forEach((item) => {
    const month = Number(item?.month);

    if (month >= 1 && month <= 12) {
      map[month] = num(
        item?.allocated_amount ??
          item?.allocatedAmount ??
          item?.amount
      );
    }
  });

  const complete = MONTHS.every(
    (month) =>
      Object.prototype.hasOwnProperty.call(map, month.number)
  );

  if (!complete) {
    return createAutomaticAllocations(annualAmount);
  }

  return MONTHS.map((month) => ({
    month: month.number,
    allocated_amount: num(map[month.number]),
  }));
};

const getBudgetSpent = (budget, expenses) => {
  const budgetCategory = normalizeCategory(
    budget?.category
  ).toLowerCase();

  if (!budgetCategory) {
    return 0;
  }

  return safeArray(expenses)
    .filter((expense) => {
      const expenseCategory = normalizeCategory(
        expense?.category
      ).toLowerCase();

      return expenseCategory === budgetCategory;
    })
    .reduce(
      (total, expense) => total + num(expense?.amount),
      0
    );
};

/*
  Important:
  Duplicate categories are allowed.

  Example:

  Food #12 -> ₹10,000
  Food #18 -> ₹5,000

  They remain separate budget records.

  The backend itself is designed this way.
*/

/* =========================================================
   COMPONENT
========================================================= */

function Budget() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const settings = useAppSettings();

  const currency =
    settings?.currency || "INR";
  const currencyMeta = getCurrencyMeta(currency);

  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */

  const [category, setCategory] = useState("");
  const [annualAmount, setAnnualAmount] = useState("");

  const [budgetYear, setBudgetYear] = useState(
    CURRENT_YEAR
  );

  const [allocationMode, setAllocationMode] =
    useState("automatic");

  const [
    monthlyAllocations,
    setMonthlyAllocations,
  ] = useState(
    createAutomaticAllocations(0)
  );

  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [editingId, setEditingId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [expandedBudgetId, setExpandedBudgetId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadBudgets = useCallback(
    async (showLoading = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const data = await getBudget(
          budgetYear
        );

        setBudgets(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Budget loading failed:",
          error
        );

        toast.error(
          error?.response?.data?.detail ||
            "Unable to load budgets"
        );
      } finally {
        setLoading(false);
      }
    },
    [budgetYear, user?.id]
  );

  /*
    Expenses are intentionally loaded through the existing
    service only if available in the current application.
    The import is dynamic so this Budget page does not
    hard-depend on another page's implementation.
  */

  const loadExpenses = useCallback(
    async () => {
      try {
        const module =
          await import(
            "../services/expenseService"
          );

        if (
          typeof module.getExpense ===
          "function"
        ) {
          const data =
            await module.getExpense();

          setExpenses(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.warn(
          "Expense data could not be loaded for budget progress:",
          error
        );
      }
    },
    []
  );

  useEffect(() => {
    loadBudgets(true);
    loadExpenses();
  }, [
    loadBudgets,
    loadExpenses,
  ]);

  useEffect(() => {
    const refresh = () => {
      loadBudgets();
      loadExpenses();
    };

    window.addEventListener(
      "bb:data-changed",
      refresh
    );

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      window.removeEventListener(
        "bb:data-changed",
        refresh
      );

      window.removeEventListener(
        "focus",
        refresh
      );
    };
  }, [
    loadBudgets,
    loadExpenses,
  ]);

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  const resetForm = () => {
    setCategory("");
    setAnnualAmount("");
    setBudgetYear(CURRENT_YEAR);
    setAllocationMode("automatic");

    setMonthlyAllocations(
      createAutomaticAllocations(0)
    );

    setEditingId(null);
  };

  const updateAnnualAmount = (value) => {
    setAnnualAmount(value);

    /*
      When automatic mode is selected, changing
      the annual budget immediately recalculates
      all 12 months.
    */

    if (
      allocationMode === "automatic"
    ) {
      setMonthlyAllocations(
        createAutomaticAllocations(
          value
        )
      );
    }
  };

  const changeAllocationMode = (
    mode
  ) => {
    setAllocationMode(mode);

    if (
      mode === "automatic"
    ) {
      setMonthlyAllocations(
        createAutomaticAllocations(
          annualAmount
        )
      );
    }
  };

  const updateMonthlyAllocation = (
    month,
    value
  ) => {
    setMonthlyAllocations(
      (previous) =>
        previous.map((item) =>
          item.month === month
            ? {
                ...item,
                allocated_amount:
                  value === ""
                    ? ""
                    : Number(value),
              }
            : item
        )
    );
  };

  /* =======================================================
     ALLOCATION TOTALS
  ======================================================= */

  const allocationTotal = useMemo(
    () =>
      monthlyAllocations.reduce(
        (sum, item) =>
          sum +
          num(
            item.allocated_amount
          ),
        0
      ),
    [monthlyAllocations]
  );

  const annualTotal = num(
    annualAmount
  );

  const allocationDifference =
    Number(
      (
        allocationTotal -
        annualTotal
      ).toFixed(2)
    );

  const allocationsBalanced =
    annualTotal > 0 &&
    Math.abs(
      allocationDifference
    ) < 0.01;

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = async (event) => {
    event.preventDefault();

    const cleanCategory =
      normalizeCategory(category);

    const amount =
      Number(annualAmount);

    if (!cleanCategory) {
      toast.warning(
        "Enter a budget category."
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.warning(
        "Enter a valid annual budget amount."
      );
      return;
    }

    let allocations =
      monthlyAllocations;

    /*
      Automatic mode is always generated locally.
    */

    if (
      allocationMode ===
      "automatic"
    ) {
      allocations =
        createAutomaticAllocations(
          amount
        );
    }

    /*
      Custom mode must exactly match
      the annual amount.
    */

    if (
      allocationMode === "custom"
    ) {
      const total =
        allocations.reduce(
          (sum, item) =>
            sum +
            num(
              item.allocated_amount
            ),
          0
        );

      if (
        Math.abs(
          total - amount
        ) >= 0.01
      ) {
        toast.warning(
          `Monthly allocations must equal ${formatMoney(
            amount,
            currency
          )}. Current allocation is ${formatMoney(
            total,
            currency
          )}.`
        );

        return;
      }

      const hasNegative =
        allocations.some(
          (item) =>
            num(
              item.allocated_amount
            ) < 0
        );

      if (hasNegative) {
        toast.warning(
          "Monthly allocations cannot be negative."
        );

        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        category:
          cleanCategory,

        // Budget values are entered in the selected display currency;
        // the API/database continue to store INR.
        budget_amount:
          convertToINR(amount, currency),

        budget_year:
          budgetYear,

        /*
          This matches the backend's
          monthly allocation model.
        */

        monthly_allocations:
          allocations.map(
            (item) => ({
              month:
                Number(item.month),

              allocated_amount:
                convertToINR(
                  num(item.allocated_amount),
                  currency
                ),
            })
          ),
      };

      if (editingId) {
        await updateBudget(
          editingId,
          payload
        );

        toast.success(
          "Budget updated successfully."
        );
      } else {
        /*
          IMPORTANT:
          Do NOT search for an existing
          category here.

          This intentionally creates a
          NEW budget even if Food already
          exists.
        */

        await addBudget(
          payload
        );

        toast.success(
          `${cleanCategory} budget created successfully.`
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "bb:data-changed"
        )
      );

      resetForm();

      await loadBudgets();
    } catch (error) {
      console.error(
        "Budget save failed:",
        error
      );

      const detail =
        error?.response?.data
          ?.detail;

      toast.error(
        typeof detail ===
          "string"
          ? detail
          : "Unable to save budget."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const startEdit = (budget) => {
    setEditingId(
      budget.id
    );

    setCategory(
      budget.category || ""
    );

    setAnnualAmount(
      budget.budget_amount == null
        ? ""
        : String(Number(convertCurrency(budget.budget_amount, currency).toFixed(2)))
    );

    setBudgetYear(
      Number(
        budget.budget_year ||
          CURRENT_YEAR
      )
    );

    const existing = normalizeAllocations(
      budget,
      budget.budget_amount
    ).map((item) => ({
      ...item,
      allocated_amount: Number(
        convertCurrency(item.allocated_amount, currency).toFixed(2)
      ),
    }));

    setMonthlyAllocations(
      existing
    );

    /*
      If backend has custom allocations
      and they don't equal automatic values,
      open in custom mode.
    */

    const automatic =
      createAutomaticAllocations(
        Number(convertCurrency(budget.budget_amount, currency).toFixed(2))
      );

    const isAutomatic =
      existing.every(
        (item, index) =>
          Math.abs(
            num(
              item.allocated_amount
            ) -
              num(
                automatic[index]
                  .allocated_amount
              )
          ) < 0.01
      );

    setAllocationMode(
      isAutomatic
        ? "automatic"
        : "custom"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     DUPLICATE BUDGET
  ======================================================= */

  const duplicateBudget = (
    budget
  ) => {
    setEditingId(null);

    setCategory(
      `${budget.category || "Budget"}`
    );

    setAnnualAmount(
      budget.budget_amount == null
        ? ""
        : String(Number(convertCurrency(budget.budget_amount, currency).toFixed(2)))
    );

    setBudgetYear(
      Number(
        budget.budget_year ||
          CURRENT_YEAR
      )
    );

    setMonthlyAllocations(
      normalizeAllocations(
        budget,
        budget.budget_amount
      ).map((item) => ({
        ...item,
        allocated_amount: Number(
          convertCurrency(item.allocated_amount, currency).toFixed(2)
        ),
      }))
    );

    setAllocationMode(
      "custom"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    toast.success(
      "Budget copied. Change the amount or category and save it as a new budget."
    );
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const removeBudget = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Delete this budget?\n\nOnly this budget record will be deleted."
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBudget(id);

      if (
        editingId === id
      ) {
        resetForm();
      }

      toast.success(
        "Budget deleted successfully."
      );

      window.dispatchEvent(
        new CustomEvent(
          "bb:data-changed"
        )
      );

      await loadBudgets();
    } catch (error) {
      console.error(
        "Budget delete failed:",
        error
      );

      toast.error(
        error?.response?.data
          ?.detail ||
          "Unable to delete budget."
      );
    }
  };

  /* =======================================================
     BUDGET VIEW DATA
  ======================================================= */

  const budgetCards =
    useMemo(() => {
      return budgets.map(
        (budget) => {
          const total =
            num(
              budget.budget_amount
            );

          const spent =
            getBudgetSpent(
              budget,
              expenses
            );

          const rawPercentage =
            total > 0
              ? (spent / total) *
                100
              : 0;

          const percentage =
            Math.min(
              100,
              Math.max(
                0,
                rawPercentage
              )
            );

          const remaining =
            Math.max(
              0,
              total - spent
            );

          let status =
            "healthy";

          if (
            rawPercentage >=
            100
          ) {
            status =
              "exceeded";
          } else if (
            rawPercentage >=
            80
          ) {
            status =
              "warning";
          }

          return {
            ...budget,
            total,
            spent,
            remaining,
            percentage,
            rawPercentage,
            status,
            allocations:
              normalizeAllocations(
                budget,
                total
              ),
          };
        }
      );
    }, [
      budgets,
      expenses,
    ]);

  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredBudgets =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return budgetCards.filter(
        (budget) => {
          if (query) {
            const matches =
              String(
                budget.category ||
                  ""
              )
                .toLowerCase()
                .includes(query) ||
              String(
                budget.id || ""
              ).includes(query);

            if (!matches) {
              return false;
            }
          }

          if (
            statusFilter ===
            "healthy"
          ) {
            return (
              budget.status ===
              "healthy"
            );
          }

          if (
            statusFilter ===
            "warning"
          ) {
            return (
              budget.status ===
                "warning" ||
              budget.status ===
                "exceeded"
            );
          }

          if (
            statusFilter ===
            "exceeded"
          ) {
            return (
              budget.status ===
              "exceeded"
            );
          }

          return true;
        }
      );
    }, [
      budgetCards,
      search,
      statusFilter,
    ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    useMemo(() => {
      const total =
        budgetCards.reduce(
          (sum, item) =>
            sum + item.total,
          0
        );

      const spent =
        budgetCards.reduce(
          (sum, item) =>
            sum + item.spent,
          0
        );

      const remaining =
        Math.max(
          0,
          total - spent
        );

      const percentage =
        total > 0
          ? Math.min(
              100,
              (spent / total) *
                100
            )
          : 0;

      return {
        total,
        spent,
        remaining,
        percentage,
      };
    }, [
      budgetCards,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <Sidebar />
        <Navbar />

        <main className="budget-page">
          <div className="budget-loading">
            <div className="budget-loading-spinner" />

            <h2>
              Loading your budgets...
            </h2>

            <p>
              Preparing your budget
              control center.
            </p>
          </div>
        </main>
      </>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Sidebar />
      <Navbar />

      <main className="budget-page">
        <div className="budget-container">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="budget-hero">

            <div className="budget-hero-content">

              <span className="budget-eyebrow">
                BUDGETBUDDY • BUDGET CONTROL
              </span>

              <h1>
                Plan your money
                <span>
                  with precision.
                </span>
              </h1>

              <p>
                Create independent
                budgets, distribute
                them across the year,
                and track every
                category in real time.
              </p>

            </div>

            <div className="budget-hero-icon">
              <FaWallet />
            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="budget-summary-grid">

            <div className="budget-summary-card">

              <div className="budget-summary-icon blue">
                <FaWallet />
              </div>

              <div>
                <span>
                  TOTAL BUDGET
                </span>

                <strong>
                  {formatMoney(
                    summary.total,
                    currency
                  )}
                </strong>

                <small>
                  {budgetCards.length}{" "}
                  budget record
                  {budgetCards.length ===
                  1
                    ? ""
                    : "s"}
                </small>
              </div>

            </div>

            <div className="budget-summary-card">

              <div className="budget-summary-icon orange">
                <FaChartLine />
              </div>

              <div>
                <span>
                  TOTAL SPENT
                </span>

                <strong>
                  {formatMoney(
                    summary.spent,
                    currency
                  )}
                </strong>

                <small>
                  {summary.percentage.toFixed(
                    0
                  )}
                  % of budget used
                </small>
              </div>

            </div>

            <div className="budget-summary-card">

              <div className="budget-summary-icon green">
                <FaCheckCircle />
              </div>

              <div>
                <span>
                  REMAINING
                </span>

                <strong>
                  {formatMoney(
                    summary.remaining,
                    currency
                  )}
                </strong>

                <small>
                  Available budget
                </small>
              </div>

            </div>

          </section>

          {/* =================================================
              CREATE / EDIT FORM
          ================================================= */}

          <section className="budget-builder-card">

            <div className="budget-builder-header">

              <div>

                <span className="section-eyebrow">
                  {editingId
                    ? "EDIT BUDGET"
                    : "CREATE NEW BUDGET"}
                </span>

                <h2>
                  {editingId
                    ? "Update your budget"
                    : "Build a budget plan"}
                </h2>

                <p>
                  Duplicate categories
                  are allowed. Each
                  budget gets its own
                  record and allocation
                  plan.
                </p>

              </div>

              {editingId && (
                <button
                  type="button"
                  className="budget-cancel-btn"
                  onClick={
                    resetForm
                  }
                >
                  Cancel edit
                </button>
              )}

            </div>

            <form
              className="budget-form"
              onSubmit={submit}
            >

              <div className="budget-form-grid">

                {/* CATEGORY */}

                <div className="budget-input-group">

                  <label>
                    Budget Category
                  </label>

                  <div className="budget-input-wrap">

                    <FaWallet />

                    <input
                      type="text"
                      placeholder="e.g. Food"
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target
                            .value
                        )
                      }
                    />

                  </div>

                  <small>
                    You can create
                    <strong>
                      {" "}
                      Food
                    </strong>{" "}
                    multiple times.
                  </small>

                </div>

                {/* YEAR */}

                <div className="budget-input-group">

                  <label>
                    Budget Year
                  </label>

                  <div className="budget-input-wrap">

                    <FaCalendarAlt />

                    <select
                      value={
                        budgetYear
                      }
                      onChange={(event) =>
                        setBudgetYear(
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                    >
                      {YEARS.map(
                        (year) => (
                          <option
                            key={year}
                            value={year}
                          >
                            {year}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                </div>

                {/* AMOUNT */}

                <div className="budget-input-group">

                  <label>
                    Annual Budget
                  </label>

                  <div className="budget-input-wrap">

                    <span className="budget-currency-symbol">
                      {currencyMeta.symbol}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10000"
                      value={
                        annualAmount
                      }
                      onChange={(event) =>
                        updateAnnualAmount(
                          event.target
                            .value
                        )
                      }
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  ALLOCATION MODE
              ================================================= */}

              <div className="allocation-section">

                <div className="allocation-heading">

                  <div>

                    <span className="section-eyebrow">
                      MONTHLY ALLOCATION
                    </span>

                    <h3>
                      How should this
                      budget be distributed?
                    </h3>

                  </div>

                  <div className="allocation-total">

                    <span>
                      Allocated
                    </span>

                    <strong>
                      {formatMoney(
                        allocationTotal,
                        currency
                      )}
                    </strong>

                  </div>

                </div>

                <div className="allocation-mode-grid">

                  {/* AUTOMATIC */}

                  <button
                    type="button"
                    className={`allocation-mode ${
                      allocationMode ===
                      "automatic"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      changeAllocationMode(
                        "automatic"
                      )
                    }
                  >

                    <span className="allocation-mode-icon">
                      <FaMagic />
                    </span>

                    <span>

                      <strong>
                        Automatic
                      </strong>

                      <small>
                        Divide the annual
                        budget across
                        12 months.
                      </small>

                    </span>

                    {allocationMode ===
                      "automatic" && (
                      <FaCheckCircle className="allocation-check" />
                    )}

                  </button>

                  {/* CUSTOM */}

                  <button
                    type="button"
                    className={`allocation-mode ${
                      allocationMode ===
                      "custom"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      changeAllocationMode(
                        "custom"
                      )
                    }
                  >

                    <span className="allocation-mode-icon">
                      <FaCalculator />
                    </span>

                    <span>

                      <strong>
                        Custom
                      </strong>

                      <small>
                        Set a different
                        amount for
                        every month.
                      </small>

                    </span>

                    {allocationMode ===
                      "custom" && (
                      <FaCheckCircle className="allocation-check" />
                    )}

                  </button>

                </div>

                {/* =================================================
                    AUTOMATIC PREVIEW
                ================================================= */}

                {allocationMode ===
                  "automatic" && (
                  <div className="automatic-preview">

                    <div className="automatic-preview-header">

                      <div>

                        <strong>
                          Automatic
                          distribution
                        </strong>

                        <span>
                          The annual
                          amount is
                          distributed
                          across all
                          12 months.
                        </span>

                      </div>

                      <FaMagic />

                    </div>

                    <div className="month-preview-scroll">

                      {monthlyAllocations.map(
                        (item) => {

                          const month =
                            MONTHS.find(
                              (m) =>
                                m.number ===
                                item.month
                            );

                          return (
                            <div
                              className="month-preview"
                              key={
                                item.month
                              }
                            >

                              <span>
                                {
                                  month?.short
                                }
                              </span>

                              <strong>
                                {formatMoney(
                                  num(
                                    item.allocated_amount
                                  ),
                                  currency
                                )}
                              </strong>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

                {/* =================================================
                    CUSTOM ALLOCATION EDITOR
                ================================================= */}

                {allocationMode ===
                  "custom" && (
                  <div className="custom-allocation-editor">

                    <div className="custom-allocation-header">

                      <div>

                        <strong>
                          Custom monthly
                          allocation
                        </strong>

                        <span>
                          Every month must
                          be included exactly
                          once.
                        </span>

                      </div>

                      <div
                        className={`allocation-balance ${
                          allocationsBalanced
                            ? "balanced"
                            : "unbalanced"
                        }`}
                      >

                        {allocationsBalanced ? (
                          <>
                            <FaCheckCircle />
                            Balanced
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle />
                            Difference:{" "}
                            {formatMoney(
                              Math.abs(
                                allocationDifference
                              ),
                              currency
                            )}
                          </>
                        )}

                      </div>

                    </div>

                    <div className="custom-month-grid">

                      {monthlyAllocations.map(
                        (item) => {

                          const month =
                            MONTHS.find(
                              (m) =>
                                m.number ===
                                item.month
                            );

                          return (
                            <div
                              className="custom-month-input"
                              key={
                                item.month
                              }
                            >

                              <label>
                                {
                                  month?.full
                                }
                              </label>

                              <div>

                                <span>
                                  {currencyMeta.symbol}
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.allocated_amount
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateMonthlyAllocation(
                                      item.month,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                />

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    <div className="allocation-validation">

                      <span>
                        Annual budget
                      </span>

                      <strong>
                        {formatMoney(
                          annualTotal,
                          currency
                        )}
                      </strong>

                      <span>
                        Monthly total
                      </span>

                      <strong>
                        {formatMoney(
                          allocationTotal,
                          currency
                        )}
                      </strong>

                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  SAVE
              ================================================= */}

              <div className="budget-submit-row">

                <div>

                  <span>
                    {editingId
                      ? `Editing budget #${editingId}`
                      : "New independent budget"}
                  </span>

                  <small>
                    Your financial
                    transaction data
                    will not be changed.
                  </small>

                </div>

                <button
                  type="submit"
                  className="budget-primary-btn"
                  disabled={
                    saving ||
                    !category.trim() ||
                    !annualTotal ||
                    (allocationMode ===
                      "custom" &&
                      !allocationsBalanced)
                  }
                >

                  {saving ? (
                    "Saving..."
                  ) : editingId ? (
                    <>
                      <FaEdit />
                      Update Budget
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Create Budget
                    </>
                  )}

                </button>

              </div>

            </form>

          </section>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <section className="budget-controls">

            <div className="budget-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search budget category or ID..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="budget-filter">

              <button
                className={
                  statusFilter ===
                  "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "all"
                  )
                }
              >
                All
              </button>

              <button
                className={
                  statusFilter ===
                  "healthy"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "healthy"
                  )
                }
              >
                Healthy
              </button>

              <button
                className={
                  statusFilter ===
                  "warning"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "warning"
                  )
                }
              >
                Near limit
              </button>

              <button
                className={
                  statusFilter ===
                  "exceeded"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "exceeded"
                  )
                }
              >
                Exceeded
              </button>

            </div>

          </section>

          {/* =================================================
              BUDGET LIST
          ================================================= */}

          <section className="budget-list-section">

            <div className="budget-list-header">

              <div>

                <span className="section-eyebrow">
                  YOUR BUDGETS
                </span>

                <h2>
                  {filteredBudgets.length}{" "}
                  budget
                  {filteredBudgets.length ===
                  1
                    ? ""
                    : "s"}
                </h2>

                <p>
                  Each record is
                  independent, even
                  when categories have
                  the same name.
                </p>

              </div>

              <div className="budget-year-badge">
                <FaCalendarAlt />
                {budgetYear}
              </div>

            </div>

            {filteredBudgets.length ===
            0 ? (
              <div className="budget-empty">

                <div className="budget-empty-icon">
                  <FaWallet />
                </div>

                <h3>
                  No budgets found
                </h3>

                <p>
                  Create a budget above
                  or change your search
                  filter.
                </p>

              </div>
            ) : (
              <div className="budget-card-list">

                {filteredBudgets.map(
                  (budget) => {

                    const expanded =
                      expandedBudgetId ===
                      budget.id;

                    return (
                      <article
                        className={`budget-record ${
                          budget.status
                        }`}
                        key={
                          budget.id
                        }
                      >

                        {/* =====================================
                            CARD TOP
                        ===================================== */}

                        <div className="budget-record-top">

                          <div className="budget-record-identity">

                            <div className="budget-category-icon">
                              {String(
                                budget.category ||
                                  "B"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <div className="budget-category-title">

                                <h3>
                                  {
                                    budget.category ||
                                    "Budget"
                                  }
                                </h3>

                                <span>
                                  #
                                  {
                                    budget.id
                                  }
                                </span>

                              </div>

                              <small>
                                Budget year{" "}
                                {
                                  budget.budget_year ||
                                  budgetYear
                                }
                              </small>

                            </div>

                          </div>

                          <div className="budget-record-actions">

                            <button
                              type="button"
                              title="Duplicate budget"
                              onClick={() =>
                                duplicateBudget(
                                  budget
                                )
                              }
                            >
                              <FaCopy />
                            </button>

                            <button
                              type="button"
                              title="Edit budget"
                              onClick={() =>
                                startEdit(
                                  budget
                                )
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              title="Delete budget"
                              className="danger"
                              onClick={() =>
                                removeBudget(
                                  budget.id
                                )
                              }
                            >
                              <FaTrash />
                            </button>

                          </div>

                        </div>

                        {/* =====================================
                            FINANCIAL METRICS
                        ===================================== */}

                        <div className="budget-record-metrics">

                          <div>

                            <span>
                              ANNUAL BUDGET
                            </span>

                            <strong>
                              {formatMoney(
                                budget.total,
                                currency
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              SPENT
                            </span>

                            <strong>
                              {formatMoney(
                                budget.spent,
                                currency
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              REMAINING
                            </span>

                            <strong>
                              {formatMoney(
                                budget.remaining,
                                currency
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              STATUS
                            </span>

                            <strong
                              className={`budget-status-text ${budget.status}`}
                            >
                              {budget.status ===
                              "exceeded"
                                ? "Exceeded"
                                : budget.status ===
                                  "warning"
                                ? "Near limit"
                                : "Healthy"}
                            </strong>

                          </div>

                        </div>

                        {/* =====================================
                            PROGRESS
                        ===================================== */}

                        <div className="budget-progress-area">

                          <div className="budget-progress-heading">

                            <span>
                              Budget utilisation
                            </span>

                            <strong>
                              {budget.rawPercentage.toFixed(
                                0
                              )}
                              %
                            </strong>

                          </div>

                          <div className="budget-progress-track">

                            <span
                              style={{
                                width: `${budget.percentage}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* =====================================
                            MONTHLY TOGGLE
                        ===================================== */}

                        <button
                          type="button"
                          className="monthly-toggle"
                          onClick={() =>
                            setExpandedBudgetId(
                              expanded
                                ? null
                                : budget.id
                            )
                          }
                        >

                          <span>

                            <FaCalendarAlt />

                            Monthly allocation

                          </span>

                          {expanded ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}

                        </button>

                        {/* =====================================
                            MONTHLY ALLOCATIONS
                        ===================================== */}

                        {expanded && (
                          <div className="monthly-allocation-panel">

                            <div className="monthly-panel-header">

                              <div>

                                <strong>
                                  {
                                    budget.category
                                  }{" "}
                                  —{" "}
                                  {
                                    budget.budget_year
                                  }
                                </strong>

                                <span>
                                  12-month
                                  allocation
                                  plan
                                </span>

                              </div>

                              <strong>
                                {formatMoney(
                                  budget.allocations.reduce(
                                    (
                                      total,
                                      item
                                    ) =>
                                      total +
                                      num(
                                        item.allocated_amount
                                      ),
                                    0
                                  ),
                                  currency
                                )}
                              </strong>

                            </div>

                            <div className="monthly-scroll">

                              {budget.allocations.map(
                                (allocation) => {

                                  const month =
                                    MONTHS.find(
                                      (item) =>
                                        item.number ===
                                        Number(
                                          allocation.month
                                        )
                                    );

                                  return (
                                    <div
                                      className="monthly-budget-card"
                                      key={
                                        allocation.month
                                      }
                                    >

                                      <span>
                                        {
                                          month?.short
                                        }
                                      </span>

                                      <strong>
                                        {formatMoney(
                                          num(
                                            allocation.allocated_amount
                                          ),
                                          currency
                                        )}
                                      </strong>

                                    </div>
                                  );
                                }
                              )}

                            </div>

                            <div className="monthly-allocation-note">

                              <FaCheckCircle />

                              <span>
                                This allocation
                                belongs only to
                                budget #
                                {
                                  budget.id
                                }.
                              </span>

                            </div>

                          </div>
                        )}

                      </article>
                    );
                  }
                )}

              </div>
            )}

          </section>

        </div>
      </main>

      {/* =====================================================
          LOCAL PAGE STYLING

          This is intentionally included here so the page
          remains visually usable even if your existing
          budget.css is older.
      ===================================================== */}

      <style>{`

        .budget-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(37, 99, 235, 0.08),
              transparent 28%
            ),
            #f5f7fb;
          padding: 110px 30px 60px;
        }

        .budget-container {
          width: min(1380px, 100%);
          margin: 0 auto;
        }

        .budget-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
          padding: 36px;
          margin-bottom: 24px;
          border-radius: 26px;
          background:
            linear-gradient(
              135deg,
              #ffffff,
              #f7faff
            );
          border: 1px solid #e7ebf3;
          box-shadow:
            0 18px 50px rgba(
              15,
              23,
              42,
              0.08
            );
        }

        .budget-eyebrow,
        .section-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #2563eb;
          margin-bottom: 8px;
        }

        .budget-hero h1 {
          margin: 0;
          font-size: clamp(
            30px,
            4vw,
            48px
          );
          line-height: 1.05;
          color: #111827;
        }

        .budget-hero h1 span {
          display: block;
          color: #2563eb;
        }

        .budget-hero p {
          max-width: 650px;
          margin: 14px 0 0;
          color: #667085;
          line-height: 1.7;
        }

        .budget-hero-icon {
          width: 92px;
          height: 92px;
          min-width: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            #2563eb,
            #4f46e5
          );
          color: white;
          font-size: 36px;
          box-shadow:
            0 16px 35px rgba(
              37,
              99,
              235,
              0.25
            );
        }

        .budget-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 18px;
          margin-bottom: 24px;
        }

        .budget-summary-card {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 20px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow:
            0 10px 35px rgba(
              15,
              23,
              42,
              0.05
            );
        }

        .budget-summary-icon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          font-size: 20px;
        }

        .budget-summary-icon.blue {
          background: #eaf1ff;
          color: #2563eb;
        }

        .budget-summary-icon.orange {
          background: #fff4e8;
          color: #f97316;
        }

        .budget-summary-icon.green {
          background: #eafaf0;
          color: #16a34a;
        }

        .budget-summary-card span {
          display: block;
          color: #7b8494;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .budget-summary-card strong {
          display: block;
          margin-top: 4px;
          color: #111827;
          font-size: 22px;
        }

        .budget-summary-card small {
          display: block;
          margin-top: 3px;
          color: #98a2b3;
        }

        .budget-builder-card,
        .budget-list-section {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 24px;
          padding: 28px;
          box-shadow:
            0 12px 40px rgba(
              15,
              23,
              42,
              0.055
            );
          margin-bottom: 24px;
        }

        .budget-builder-header,
        .budget-list-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 25px;
        }

        .budget-builder-header h2,
        .budget-list-header h2 {
          margin: 0;
          font-size: 25px;
          color: #111827;
        }

        .budget-builder-header p,
        .budget-list-header p {
          margin: 7px 0 0;
          color: #7b8494;
        }

        .budget-cancel-btn {
          border: 1px solid #dbe2ed;
          background: white;
          border-radius: 12px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 700;
          color: #475467;
        }

        .budget-form-grid {
          display: grid;
          grid-template-columns:
            1.5fr
            1fr
            1.2fr;
          gap: 18px;
        }

        .budget-input-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 800;
          color: #344054;
        }

        .budget-input-wrap {
          height: 52px;
          border: 1px solid #dce3ed;
          border-radius: 14px;
          background: #fbfcfe;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          transition: 0.2s;
        }

        .budget-input-wrap:focus-within {
          border-color: #2563eb;
          box-shadow:
            0 0 0 4px
            rgba(
              37,
              99,
              235,
              0.08
            );
          background: white;
        }

        .budget-input-wrap svg {
          color: #7d8ba2;
          flex-shrink: 0;
        }

        .budget-input-wrap input,
        .budget-input-wrap select {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 15px;
          color: #101828;
        }

        .budget-currency-symbol {
          font-weight: 800;
          color: #2563eb;
        }

        .budget-input-group small {
          display: block;
          margin-top: 7px;
          color: #98a2b3;
          font-size: 11px;
        }

        .allocation-section {
          margin-top: 30px;
          border-top: 1px solid #edf0f5;
          padding-top: 28px;
        }

        .allocation-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 18px;
        }

        .allocation-heading h3 {
          margin: 0;
          color: #111827;
          font-size: 18px;
        }

        .allocation-total {
          text-align: right;
        }

        .allocation-total span {
          display: block;
          color: #98a2b3;
          font-size: 11px;
        }

        .allocation-total strong {
          color: #111827;
          font-size: 19px;
        }

        .allocation-mode-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 15px;
        }

        .allocation-mode {
          position: relative;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e1e7f0;
          background: #fbfcfe;
          border-radius: 17px;
          cursor: pointer;
          transition: 0.2s;
        }

        .allocation-mode:hover {
          transform: translateY(-1px);
          border-color: #b9cdfd;
        }

        .allocation-mode.active {
          border-color: #2563eb;
          background: #f5f8ff;
          box-shadow:
            0 8px 25px
            rgba(
              37,
              99,
              235,
              0.08
            );
        }

        .allocation-mode-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #eaf1ff;
          color: #2563eb;
        }

        .allocation-mode strong {
          display: block;
          color: #172033;
          font-size: 14px;
        }

        .allocation-mode small {
          display: block;
          color: #7b8494;
          margin-top: 3px;
          line-height: 1.4;
        }

        .allocation-check {
          margin-left: auto;
          color: #2563eb;
        }

        .automatic-preview,
        .custom-allocation-editor {
          margin-top: 18px;
          border: 1px solid #e5eaf2;
          border-radius: 18px;
          background: #fafcff;
          padding: 18px;
        }

        .automatic-preview-header,
        .custom-allocation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .automatic-preview-header strong,
        .custom-allocation-header strong {
          display: block;
          color: #1d2939;
        }

        .automatic-preview-header span,
        .custom-allocation-header span {
          display: block;
          color: #98a2b3;
          font-size: 11px;
          margin-top: 3px;
        }

        .automatic-preview-header > svg {
          color: #2563eb;
        }

        .month-preview-scroll,
        .monthly-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 5px;
          scrollbar-width: thin;
        }

        .month-preview {
          min-width: 105px;
          padding: 13px;
          border-radius: 13px;
          background: white;
          border: 1px solid #e4e9f1;
        }

        .month-preview span {
          display: block;
          color: #8b95a5;
          font-size: 11px;
          font-weight: 800;
        }

        .month-preview strong {
          display: block;
          margin-top: 5px;
          color: #172033;
          font-size: 13px;
        }

        .allocation-balance {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .allocation-balance.balanced {
          background: #eafaf0;
          color: #16803b;
        }

        .allocation-balance.unbalanced {
          background: #fff3e8;
          color: #c2410c;
        }

        .custom-month-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 12px;
        }

        .custom-month-input label {
          display: block;
          margin-bottom: 6px;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
        }

        .custom-month-input > div {
          display: flex;
          align-items: center;
          border: 1px solid #dfe5ed;
          background: white;
          border-radius: 11px;
          overflow: hidden;
        }

        .custom-month-input span {
          padding-left: 10px;
          color: #7b8494;
          font-size: 12px;
          font-weight: 700;
        }

        .custom-month-input input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 10px 8px;
          background: transparent;
          color: #172033;
        }

        .allocation-validation {
          margin-top: 16px;
          padding-top: 15px;
          border-top: 1px solid #e6ebf2;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          color: #667085;
          font-size: 12px;
        }

        .allocation-validation strong {
          color: #111827;
          margin-right: 15px;
        }

        .budget-submit-row {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #edf0f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .budget-submit-row span,
        .budget-submit-row small {
          display: block;
        }

        .budget-submit-row span {
          color: #344054;
          font-weight: 700;
        }

        .budget-submit-row small {
          color: #98a2b3;
          margin-top: 3px;
        }

        .budget-primary-btn {
          min-width: 190px;
          height: 50px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #4f46e5
          );
          color: white;
          font-weight: 800;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          box-shadow:
            0 10px 25px
            rgba(
              37,
              99,
              235,
              0.2
            );
        }

        .budget-primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .budget-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .budget-search {
          flex: 1;
          max-width: 480px;
          height: 48px;
          border: 1px solid #e0e6ef;
          border-radius: 13px;
          background: white;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
        }

        .budget-search svg {
          color: #98a2b3;
        }

        .budget-search input {
          border: 0;
          outline: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .budget-filter {
          display: flex;
          gap: 6px;
          background: white;
          padding: 5px;
          border: 1px solid #e4e9f0;
          border-radius: 12px;
        }

        .budget-filter button {
          border: 0;
          background: transparent;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }

        .budget-filter button.active {
          background: #2563eb;
          color: white;
        }

        .budget-year-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #eff4ff;
          color: #2563eb;
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 800;
        }

        .budget-card-list {
          display: grid;
          gap: 16px;
        }

        .budget-record {
          border: 1px solid #e4e9f1;
          border-radius: 20px;
          background: white;
          overflow: hidden;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }

        .budget-record:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 35px
            rgba(
              15,
              23,
              42,
              0.07
            );
        }

        .budget-record.exceeded {
          border-color: #fecaca;
        }

        .budget-record.warning {
          border-color: #fed7aa;
        }

        .budget-record-top {
          padding: 20px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .budget-record-identity {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .budget-category-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #eaf1ff;
          color: #2563eb;
          font-weight: 900;
          font-size: 18px;
        }

        .budget-category-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .budget-category-title h3 {
          margin: 0;
          font-size: 17px;
          color: #172033;
        }

        .budget-category-title span {
          background: #f1f4f8;
          color: #7b8494;
          border-radius: 999px;
          padding: 3px 7px;
          font-size: 9px;
          font-weight: 800;
        }

        .budget-record-identity small {
          display: block;
          margin-top: 4px;
          color: #98a2b3;
        }

        .budget-record-actions {
          display: flex;
          gap: 7px;
        }

        .budget-record-actions button {
          width: 36px;
          height: 36px;
          border: 1px solid #e3e8ef;
          background: white;
          border-radius: 10px;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #667085;
        }

        .budget-record-actions button:hover {
          background: #f5f8ff;
          color: #2563eb;
          border-color: #bfd0fa;
        }

        .budget-record-actions button.danger:hover {
          color: #dc2626;
          background: #fff5f5;
          border-color: #fecaca;
        }

        .budget-record-metrics {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          padding: 18px 22px;
          background: #fafbfc;
          border-top: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .budget-record-metrics > div {
          padding-right: 15px;
          border-right: 1px solid #e8ecf2;
        }

        .budget-record-metrics > div:not(:first-child) {
          padding-left: 20px;
        }

        .budget-record-metrics > div:last-child {
          border-right: 0;
        }

        .budget-record-metrics span {
          display: block;
          color: #98a2b3;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .budget-record-metrics strong {
          display: block;
          margin-top: 5px;
          color: #172033;
          font-size: 15px;
        }

        .budget-status-text.healthy {
          color: #16a34a;
        }

        .budget-status-text.warning {
          color: #ea580c;
        }

        .budget-status-text.exceeded {
          color: #dc2626;
        }

        .budget-progress-area {
          padding: 18px 22px 10px;
        }

        .budget-progress-heading {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .budget-progress-heading span {
          color: #667085;
          font-size: 11px;
          font-weight: 700;
        }

        .budget-progress-heading strong {
          color: #172033;
          font-size: 12px;
        }

        .budget-progress-track {
          width: 100%;
          height: 9px;
          border-radius: 99px;
          background: #edf1f6;
          overflow: hidden;
        }

        .budget-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #2563eb,
            #4f46e5
          );
          transition: width 0.4s;
        }

        .budget-record.warning
          .budget-progress-track
          span {
          background: linear-gradient(
            90deg,
            #f59e0b,
            #f97316
          );
        }

        .budget-record.exceeded
          .budget-progress-track
          span {
          background: linear-gradient(
            90deg,
            #ef4444,
            #dc2626
          );
        }

        .monthly-toggle {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 15px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          color: #344054;
          font-weight: 800;
          font-size: 12px;
        }

        .monthly-toggle span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .monthly-toggle svg {
          color: #2563eb;
        }

        .monthly-allocation-panel {
          padding: 0 22px 20px;
        }

        .monthly-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
          padding-top: 4px;
        }

        .monthly-panel-header strong {
          display: block;
          color: #172033;
        }

        .monthly-panel-header span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          margin-top: 3px;
        }

        .monthly-budget-card {
          min-width: 115px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #e4e9f1;
          background: #fafcff;
        }

        .monthly-budget-card span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 800;
        }

        .monthly-budget-card strong {
          display: block;
          margin-top: 5px;
          color: #172033;
          font-size: 13px;
        }

        .monthly-allocation-note {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #16a34a;
          font-size: 11px;
        }

        .budget-empty {
          text-align: center;
          padding: 65px 20px;
          border: 1px dashed #d8e0eb;
          border-radius: 18px;
          background: #fafcff;
        }

        .budget-empty-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 12px;
          border-radius: 17px;
          display: grid;
          place-items: center;
          background: #eaf1ff;
          color: #2563eb;
          font-size: 22px;
        }

        .budget-empty h3 {
          margin: 0;
          color: #172033;
        }

        .budget-empty p {
          color: #98a2b3;
          margin: 6px 0 0;
        }

        .budget-loading {
          min-height: 60vh;
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
        }

        .budget-loading-spinner {
          width: 42px;
          height: 42px;
          border: 4px solid #dbe6ff;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: budget-spin 0.8s linear infinite;
          margin-bottom: 18px;
        }

        .budget-loading h2 {
          margin: 0;
          color: #172033;
        }

        .budget-loading p {
          color: #98a2b3;
        }

        @keyframes budget-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1000px) {

          .budget-summary-grid {
            grid-template-columns:
              1fr;
          }

          .budget-form-grid {
            grid-template-columns:
              1fr;
          }

          .budget-record-metrics {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
            gap: 16px;
          }

          .budget-record-metrics > div {
            border-right: 0;
          }

          .budget-record-metrics > div:not(:first-child) {
            padding-left: 0;
          }

          .custom-month-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
          }

        }

        @media (max-width: 720px) {

          .budget-page {
            padding: 95px 14px 40px;
          }

          .budget-hero {
            padding: 25px;
          }

          .budget-hero-icon {
            display: none;
          }

          .allocation-mode-grid {
            grid-template-columns:
              1fr;
          }

          .custom-month-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .budget-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .budget-search {
            max-width: none;
          }

          .budget-filter {
            overflow-x: auto;
          }

          .budget-submit-row {
            flex-direction: column;
            align-items: stretch;
          }

          .budget-primary-btn {
            width: 100%;
          }

          .budget-record-top {
            align-items: flex-start;
          }

          .budget-record-actions {
            flex-wrap: wrap;
          }

          .budget-record-metrics {
            grid-template-columns:
              1fr 1fr;
          }

        }

      `}</style>
    </>
  );
}

export default Budget;