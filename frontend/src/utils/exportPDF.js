import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney } from "./settings";

const arr = (v) =>
  Array.isArray(v) ? v : [];

const n = (v) =>
  Number.isFinite(Number(v))
    ? Number(v)
    : 0;

// Delegates to the same centralized, tested conversion logic used
// everywhere else in the app (utils/settings.js) so the PDF never
// shows a different number than the rest of the UI for the same
// stored (INR) amount. Previously this duplicated its own formatting
// that swapped the currency SYMBOL without ever converting the VALUE
// — e.g. an INR 10,000 amount would print as "$10,000" instead of
// the correct ~"$118" — which is exactly the bug this delegates
// around.
const money = (v, c = "INR") => formatMoney(v, c);

const dt = (v) => {
  if (!v) return "-";

  const d = new Date(v);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  return d.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const tm = (v) => {
  if (!v) return "-";

  const d = new Date(v);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  return d.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
};

const bankName = (
  banks,
  id
) => {
  const b = arr(banks).find(
    (x) =>
      String(x.id) ===
      String(id)
  );

  return (
    b?.bank_name ||
    b?.name ||
    "Unlinked"
  );
};

// =========================================================
// PDF HEADER
// =========================================================

const header = (
  doc,
  title,
  subtitle,
  pro = false
) => {
  const w =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(
    20,
    18,
    50
  );

  doc.rect(
    0,
    0,
    w,
    40,
    "F"
  );

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(20);

  doc.text(
    "BudgetBuddy",
    18,
    16
  );

  doc.setFontSize(11);

  doc.text(
    title,
    18,
    26
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.text(
    subtitle,
    18,
    34
  );

  if (pro) {
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      "PRO",
      w - 18,
      16,
      {
        align: "right",
      }
    );
  }
};

// =========================================================
// FOOTER
// =========================================================

const footer = (doc) => {
  const count =
    doc.internal.getNumberOfPages();

  const w =
    doc.internal.pageSize.getWidth();

  const h =
    doc.internal.pageSize.getHeight();

  for (
    let i = 1;
    i <= count;
    i++
  ) {
    doc.setPage(i);

    doc.setFontSize(7);

    doc.setTextColor(
      120,
      130,
      145
    );

    doc.text(
      "BudgetBuddy • Confidential financial report",
      18,
      h - 10
    );

    doc.text(
      `Page ${i} of ${count}`,
      w - 18,
      h - 10,
      {
        align: "right",
      }
    );
  }
};

// =========================================================
// TABLE
// =========================================================

const table = (
  doc,
  head,
  body,
  startY
) =>
  autoTable(doc, {
    startY,

    head: [head],

    body,

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 4,
      textColor: [
        45,
        55,
        72,
      ],
    },

    headStyles: {
      fillColor: [
        79,
        70,
        229,
      ],

      textColor: 255,

      fontStyle:
        "bold",
    },

    alternateRowStyles: {
      fillColor: [
        248,
        250,
        252,
      ],
    },

    margin: {
      left: 18,
      right: 18,
    },
  });

// =========================================================
// MAIN EXPORT
// =========================================================

export const exportFinancialPDF = (
  income = [],
  expense = [],
  bankAccounts = [],
  budgets = [],
  savingsGoals = [],
  options = {}
) => {
  const currency =
    options.currency ||
    "INR";

  const user =
    options.user ||
    JSON.parse(
      localStorage.getItem(
        "user"
      ) || "null"
    );

  const pro =
    String(
      user?.account_tier || ""
    ).toLowerCase() ===
    "premium";

  const doc =
    new jsPDF({
      unit: "mm",
      format: "a4",
    });

  // =====================================================
  // TOTALS
  // =====================================================

  const totalIncome =
    arr(income).reduce(
      (s, x) =>
        s + n(x.amount),
      0
    );

  const totalExpense =
    arr(expense).reduce(
      (s, x) =>
        s + n(x.amount),
      0
    );

  const totalBudget =
    arr(budgets).reduce(
      (s, x) =>
        s +
        n(
          x.budget_amount
        ),
      0
    );

  const saved =
    arr(savingsGoals).reduce(
      (s, x) =>
        s +
        n(
          x.saved_amount
        ),
      0
    );

  const target =
    arr(savingsGoals).reduce(
      (s, x) =>
        s +
        n(
          x.target_amount
        ),
      0
    );

  const bankBal =
    arr(bankAccounts).reduce(
      (s, x) =>
        s + n(x.balance),
      0
    );

  // =====================================================
  // EXECUTIVE SUMMARY
  // =====================================================

  header(
    doc,

    "Financial Intelligence Report",

    `${
      user?.full_name ||
      "User"
    } • ${
      user?.email || ""
    } • Currency: ${currency}`,

    pro
  );

  doc.setTextColor(
    25,
    35,
    55
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    "Executive Summary",
    18,
    56
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  doc.setTextColor(
    100,
    110,
    125
  );

  doc.text(
    `Generated ${new Date().toLocaleString(
      "en-IN"
    )}`,
    18,
    63
  );

  table(
    doc,

    [
      "Metric",
      "Value",
    ],

    [
      [
        "Total Income",
        money(
          totalIncome,
          currency
        ),
      ],

      [
        "Total Expense",
        money(
          totalExpense,
          currency
        ),
      ],

      [
        "Net Balance",
        money(
          totalIncome -
            totalExpense,
          currency
        ),
      ],

      [
        "Total Budget",
        money(
          totalBudget,
          currency
        ),
      ],

      [
        "Total Saved",
        money(
          saved,
          currency
        ),
      ],

      [
        "Savings Target",
        money(
          target,
          currency
        ),
      ],

      [
        "Bank Balance",
        money(
          bankBal,
          currency
        ),
      ],

      [
        "Transactions",
        String(
          arr(income)
            .length +
            arr(expense)
              .length
        ),
      ],

      [
        "Budgets",
        String(
          arr(budgets).length
        ),
      ],

      [
        "Savings Goals",
        String(
          arr(savingsGoals)
            .length
        ),
      ],
    ],

    70
  );

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  doc.addPage();

  header(
    doc,
    "Transaction Ledger",
    "Detailed income and expense activity",
    pro
  );

  doc.setTextColor(
    25,
    35,
    55
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Transactions",
    18,
    55
  );

  const tx = [
    ...arr(income).map(
      (x) => [
        dt(
          x.transaction_date ||
            x.created_at
        ),

        tm(
          x.transaction_date ||
            x.created_at
        ),

        "Income",

        x.source || "",

        x.category || "",

        (x.payment_method && x.payment_method !== "Bank")
          ? x.payment_method
          : bankName(
              bankAccounts,
              x.bank_account_id
            ),

        x.description ||
          "",

        money(
          x.amount,
          currency
        ),
      ]
    ),

    ...arr(expense).map(
      (x) => [
        dt(
          x.transaction_date ||
            x.created_at
        ),

        tm(
          x.transaction_date ||
            x.created_at
        ),

        "Expense",

        "",

        x.category || "",

        (x.payment_method && x.payment_method !== "Bank")
          ? x.payment_method
          : bankName(
              bankAccounts,
              x.bank_account_id
            ),

        x.description ||
          "",

        money(
          x.amount,
          currency
        ),
      ]
    ),
  ].sort((a, b) =>
    `${b[0]} ${b[1]}`.localeCompare(
      `${a[0]} ${a[1]}`
    )
  );

  table(
    doc,

    [
      "Date",
      "Time",
      "Type",
      "Source",
      "Category",
      "Payment Method",
      "Description",
      "Amount",
    ],

    tx,

    62
  );

  // =====================================================
  // BUDGETS
  // =====================================================

  doc.addPage();

  header(
    doc,
    "Budget Register",
    "Every configured budget as an independent record",
    pro
  );

  doc.setTextColor(
    25,
    35,
    55
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Budgets",
    18,
    55
  );

  table(
    doc,

    [
      "Category",
      "Year",
      "Budget",
      "Created",
      "Updated",
    ],

    arr(budgets).map(
      (x) => [
        x.category ||
          "General",

        x.budget_year ||
          "",

        money(
          x.budget_amount,
          currency
        ),

        dt(
          x.created_at
        ),

        dt(
          x.updated_at
        ),
      ]
    ),

    62
  );

  // =====================================================
  // SAVINGS
  // =====================================================

  doc.addPage();

  header(
    doc,
    "Savings Goals",
    "Targets and individual progress",
    pro
  );

  doc.setTextColor(
    25,
    35,
    55
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Savings Goals",
    18,
    55
  );

  table(
    doc,

    [
      "Goal",
      "Target",
      "Saved",
      "Remaining",
      "Progress",
    ],

    arr(
      savingsGoals
    ).map((x) => {
      const target =
        n(
          x.target_amount
        );

      const saved =
        n(
          x.saved_amount
        );

      const progress =
        target
          ? Math.min(
              100,
              (saved /
                target) *
                100
            )
          : 0;

      return [
        x.goal_name ||
          "Savings Goal",

        money(
          target,
          currency
        ),

        money(
          saved,
          currency
        ),

        money(
          Math.max(
            0,
            target - saved
          ),
          currency
        ),

        `${progress.toFixed(
          1
        )}%`,
      ];
    }),

    62
  );

  // =====================================================
  // BANK ACCOUNTS
  // =====================================================

  doc.addPage();

  header(
    doc,
    "Banking Overview",
    "Linked bank accounts and current balances",
    pro
  );

  doc.setTextColor(
    25,
    35,
    55
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "Bank Accounts",
    18,
    55
  );

  table(
    doc,

    [
      "Bank",
      "Holder",
      "Account",
      "Type",
      "Opening",
      "Current",
      "Status",
    ],

    arr(
      bankAccounts
    ).map((x) => [
      x.bank_name ||
        x.name ||
        "Bank",

      x.account_holder_name ||
        "",

      x.masked_account_number ||
        x.account_number ||
        "",

      x.account_type ||
        "",

      money(
        x.opening_balance,
        currency
      ),

      money(
        x.balance,
        currency
      ),

      x.status || "",
    ]),

    62
  );

  // =====================================================
  // FOOTER + SAVE
  // =====================================================

  footer(doc);

  doc.save(
    `BudgetBuddy_${currency}_Financial_Report.pdf`
  );
};