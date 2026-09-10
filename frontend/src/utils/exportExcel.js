import * as XLSX from "xlsx";
import { formatMoney, convertCurrency } from "./settings";

/* =========================================================
   HELPERS
========================================================= */

const arr = (value) => {
    return Array.isArray(value) ? value : [];
};

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

// Delegates to the same centralized, tested conversion logic used
// everywhere else in the app (utils/settings.js). Previously this
// duplicated its own formatting that swapped the currency SYMBOL
// without ever converting the VALUE (an INR 10,000 amount printed as
// "$10,000" instead of the correct ~"$118") — this delegates around
// that bug for the Summary sheet's formatted strings.
const money = (value, currency = "INR") => formatMoney(value, currency);

// For the raw numeric "Amount"/"Budget"/etc. columns in the detail
// sheets (kept as numbers, not strings, so Excel can still sum them),
// apply the same conversion so a spreadsheet exported while "USD" is
// selected actually contains USD numbers, not raw INR numbers with a
// misleading "Currency: USD" label above them.
const numMoney = (value, currency = "INR") =>
    Number(convertCurrency(value, currency).toFixed(2));

const formatDate = (value) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const getBank = (banks, id) => {
    return arr(banks).find(
        (bank) => String(bank.id) === String(id)
    );
};

const getBankName = (banks, id) => {
    const bank = getBank(banks, id);

    return (
        bank?.bank_name ||
        bank?.name ||
        "Unlinked"
    );
};

/* =========================================================
   WORKSHEET FORMATTING
========================================================= */

const applyColumnWidths = (
    worksheet,
    headers,
    rows = []
) => {
    worksheet["!cols"] = headers.map((header, index) => {
        let maxLength = String(header).length;

        rows.forEach((row) => {
            const value = row[index];

            if (value !== undefined && value !== null) {
                maxLength = Math.max(
                    maxLength,
                    String(value).length
                );
            }
        });

        return {
            wch: Math.min(
                45,
                Math.max(12, maxLength + 3)
            ),
        };
    });
};

const addFilterAndFreeze = (
    worksheet,
    headers,
    dataLength
) => {
    const endColumn = XLSX.utils.encode_col(
        headers.length - 1
    );

    const endRow = 4 + dataLength;

    worksheet["!autofilter"] = {
        ref: `A4:${endColumn}${Math.max(4, endRow)}`,
    };

    worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: 4,
    };
};

const createProfessionalSheet = (
    title,
    subtitle,
    rows,
    headers
) => {
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    /* -----------------------------------------------------
       TITLE
    ----------------------------------------------------- */

    XLSX.utils.sheet_add_aoa(
        worksheet,
        [[title]],
        {
            origin: "A1",
        }
    );

    XLSX.utils.sheet_add_aoa(
        worksheet,
        [[subtitle]],
        {
            origin: "A2",
        }
    );

    /* -----------------------------------------------------
       HEADER + DATA
    ----------------------------------------------------- */

    const tableData = [
        headers,
        ...rows.map((row) =>
            headers.map(
                (header) =>
                    row[header] ?? ""
            )
        ),
    ];

    XLSX.utils.sheet_add_aoa(
        worksheet,
        tableData,
        {
            origin: "A4",
        }
    );

    /* -----------------------------------------------------
       MERGE TITLE
    ----------------------------------------------------- */

    const endColumn = XLSX.utils.encode_col(
        headers.length - 1
    );

    worksheet["!merges"] = [
        {
            s: {
                r: 0,
                c: 0,
            },
            e: {
                r: 0,
                c: headers.length - 1,
            },
        },
        {
            s: {
                r: 1,
                c: 0,
            },
            e: {
                r: 1,
                c: headers.length - 1,
            },
        },
    ];

    /* -----------------------------------------------------
       WIDTHS
    ----------------------------------------------------- */

    const arrayRows = rows.map((row) =>
        headers.map(
            (header) =>
                row[header] ?? ""
        )
    );

    applyColumnWidths(
        worksheet,
        headers,
        arrayRows
    );

    /* -----------------------------------------------------
       FILTER + FREEZE
    ----------------------------------------------------- */

    addFilterAndFreeze(
        worksheet,
        headers,
        rows.length
    );

    /* -----------------------------------------------------
       PRINT SETTINGS
    ----------------------------------------------------- */

    worksheet["!pageSetup"] = {
        orientation: "landscape",
        fitToWidth: 1,
        fitToHeight: 0,
    };

    worksheet["!margins"] = {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
    };

    return worksheet;
};

/* =========================================================
   MAIN EXCEL EXPORT
========================================================= */

export const exportFinancialExcel = (
    income = [],
    expense = [],
    bankAccounts = [],
    budgets = [],
    savingsGoals = [],
    options = {}
) => {
    try {
        const currency =
            options.currency || "INR";

        let user = options.user;

        if (!user) {
            try {
                user = JSON.parse(
                    localStorage.getItem("user") ||
                        "null"
                );
            } catch {
                user = null;
            }
        }

        /* -------------------------------------------------
           CREATE WORKBOOK
        ------------------------------------------------- */

        const workbook =
            XLSX.utils.book_new();

        /* -------------------------------------------------
           TOTALS
        ------------------------------------------------- */

        const totalIncome = arr(income).reduce(
            (sum, item) =>
                sum + num(item.amount),
            0
        );

        const totalExpense = arr(expense).reduce(
            (sum, item) =>
                sum + num(item.amount),
            0
        );

        const totalBudget = arr(budgets).reduce(
            (sum, item) =>
                sum + num(item.budget_amount),
            0
        );

        const totalSaved = arr(
            savingsGoals
        ).reduce(
            (sum, item) =>
                sum + num(item.saved_amount),
            0
        );

        const totalTarget = arr(
            savingsGoals
        ).reduce(
            (sum, item) =>
                sum + num(item.target_amount),
            0
        );

        const totalBankBalance = arr(
            bankAccounts
        ).reduce(
            (sum, item) =>
                sum + num(item.balance),
            0
        );

        const netBalance =
            totalIncome - totalExpense;

        const savingsProgress =
            totalTarget > 0
                ? Math.min(
                      100,
                      (totalSaved /
                          totalTarget) *
                          100
                  )
                : 0;

        /* =================================================
           SUMMARY
        ================================================= */

        const summaryRows = [
            {
                Metric: "Account Holder",
                Value:
                    user?.full_name ||
                    "User",
            },
            {
                Metric: "Email",
                Value:
                    user?.email || "-",
            },
            {
                Metric: "Currency",
                Value: currency,
            },
            {
                Metric: "Report Generated",
                Value:
                    new Date().toLocaleString(
                        "en-IN"
                    ),
            },
            {
                Metric: "Total Income",
                Value: money(
                    totalIncome,
                    currency
                ),
            },
            {
                Metric: "Total Expense",
                Value: money(
                    totalExpense,
                    currency
                ),
            },
            {
                Metric: "Net Balance",
                Value: money(
                    netBalance,
                    currency
                ),
            },
            {
                Metric: "Total Budget",
                Value: money(
                    totalBudget,
                    currency
                ),
            },
            {
                Metric: "Total Saved",
                Value: money(
                    totalSaved,
                    currency
                ),
            },
            {
                Metric: "Savings Target",
                Value: money(
                    totalTarget,
                    currency
                ),
            },
            {
                Metric: "Savings Progress",
                Value: `${savingsProgress.toFixed(
                    2
                )}%`,
            },
            {
                Metric: "Bank Balance",
                Value: money(
                    totalBankBalance,
                    currency
                ),
            },
            {
                Metric: "Income Records",
                Value: arr(income).length,
            },
            {
                Metric: "Expense Records",
                Value: arr(expense).length,
            },
            {
                Metric: "Budget Records",
                Value: arr(budgets).length,
            },
            {
                Metric: "Savings Goals",
                Value:
                    arr(savingsGoals).length,
            },
            {
                Metric: "Bank Accounts",
                Value:
                    arr(bankAccounts).length,
            },
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Financial Summary",
                `Account: ${
                    user?.full_name ||
                    "User"
                } • Currency: ${currency}`,
                summaryRows,
                [
                    "Metric",
                    "Value",
                ]
            ),
            "Summary"
        );

        /* =================================================
           TRANSACTIONS
        ================================================= */

        const transactionRows = [
            ...arr(income).map((item) => ({
                Date: formatDate(
                    item.transaction_date ||
                        item.created_at
                ),
                Time: formatTime(
                    item.transaction_date ||
                        item.created_at
                ),
                Type: "Income",
                Source:
                    item.source || "",
                Category:
                    item.category || "",
                "Payment Method":
                    item.payment_method || "Bank",
                Bank: getBankName(
                    bankAccounts,
                    item.bank_account_id
                ),
                Description:
                    item.description || "",
                Amount: numMoney(item.amount, currency),
                Created: formatDate(
                    item.created_at
                ),
            })),

            ...arr(expense).map((item) => ({
                Date: formatDate(
                    item.transaction_date ||
                        item.created_at
                ),
                Time: formatTime(
                    item.transaction_date ||
                        item.created_at
                ),
                Type: "Expense",
                Source: "",
                Category:
                    item.category || "",
                "Payment Method":
                    item.payment_method || "Bank",
                Bank: getBankName(
                    bankAccounts,
                    item.bank_account_id
                ),
                Description:
                    item.description || "",
                Amount: numMoney(item.amount, currency),
                Created: formatDate(
                    item.created_at
                ),
            })),
        ];

        transactionRows.sort(
            (a, b) =>
                `${b.Date} ${b.Time}`.localeCompare(
                    `${a.Date} ${a.Time}`
                )
        );

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Transaction Ledger",
                "Income and expense records",
                transactionRows,
                [
                    "Date",
                    "Time",
                    "Type",
                    "Source",
                    "Category",
                    "Bank",
                    "Description",
                    "Amount",
                    "Created",
                ]
            ),
            "Transactions"
        );

        /* =================================================
           INCOME
        ================================================= */

        const incomeRows = arr(income).map(
            (item) => ({
                ID: item.id ?? "",
                Date: formatDate(
                    item.transaction_date ||
                        item.created_at
                ),
                Time: formatTime(
                    item.transaction_date ||
                        item.created_at
                ),
                Source:
                    item.source || "",
                Category:
                    item.category || "",
                "Payment Method":
                    item.payment_method || "Bank",
                Bank: getBankName(
                    bankAccounts,
                    item.bank_account_id
                ),
                Description:
                    item.description || "",
                Amount: numMoney(item.amount, currency),
                Created: formatDate(
                    item.created_at
                ),
            })
        );

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Income Details",
                "Detailed income activity",
                incomeRows,
                [
                    "ID",
                    "Date",
                    "Time",
                    "Source",
                    "Category",
                    "Bank",
                    "Description",
                    "Amount",
                    "Created",
                ]
            ),
            "Income"
        );

        /* =================================================
           EXPENSE
        ================================================= */

        const expenseRows = arr(expense).map(
            (item) => ({
                ID: item.id ?? "",
                Date: formatDate(
                    item.transaction_date ||
                        item.created_at
                ),
                Time: formatTime(
                    item.transaction_date ||
                        item.created_at
                ),
                Category:
                    item.category || "",
                "Payment Method":
                    item.payment_method || "Bank",
                Bank: getBankName(
                    bankAccounts,
                    item.bank_account_id
                ),
                Description:
                    item.description || "",
                Amount: numMoney(item.amount, currency),
                Created: formatDate(
                    item.created_at
                ),
            })
        );

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Expense Details",
                "Detailed expense activity",
                expenseRows,
                [
                    "ID",
                    "Date",
                    "Time",
                    "Category",
                    "Bank",
                    "Description",
                    "Amount",
                    "Created",
                ]
            ),
            "Expenses"
        );

        /* =================================================
           BANK ACCOUNTS
        ================================================= */

        const bankRows = arr(
            bankAccounts
        ).map((item) => ({
            ID: item.id ?? "",
            Bank:
                item.bank_name ||
                item.name ||
                "Bank",
            Holder:
                item.account_holder_name ||
                "",
            Account:
                item.masked_account_number ||
                item.account_number ||
                "",
            Type:
                item.account_type || "",
            Opening: numMoney(
                item.opening_balance,
                currency
            ),
            Current: numMoney(item.balance, currency),
            Status:
                item.status || "",
            Created: formatDate(
                item.created_at
            ),
        }));

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Bank Accounts",
                "Linked banking information",
                bankRows,
                [
                    "ID",
                    "Bank",
                    "Holder",
                    "Account",
                    "Type",
                    "Opening",
                    "Current",
                    "Status",
                    "Created",
                ]
            ),
            "Bank Accounts"
        );

        /* =================================================
           BUDGETS
        ================================================= */

        const budgetRows = arr(
            budgets
        ).map((item) => {
            const budgetAmount =
                num(item.budget_amount);

            const spent = arr(expense)
                .filter(
                    (expenseItem) =>
                        String(
                            expenseItem.category ||
                                ""
                        )
                            .trim()
                            .toLowerCase() ===
                        String(
                            item.category ||
                                ""
                        )
                            .trim()
                            .toLowerCase()
                )
                .reduce(
                    (sum, expenseItem) =>
                        sum +
                        num(
                            expenseItem.amount
                        ),
                    0
                );

            const remaining =
                Math.max(
                    0,
                    budgetAmount - spent
                );

            const progress =
                budgetAmount > 0
                    ? Math.min(
                          100,
                          (spent /
                              budgetAmount) *
                              100
                      )
                    : 0;

            return {
                ID: item.id ?? "",
                Category:
                    item.category ||
                    "General",
                Year:
                    item.budget_year || "",
                Budget: numMoney(budgetAmount, currency),
                Spent: numMoney(spent, currency),
                Remaining: numMoney(remaining, currency),
                "Progress %":
                    Number(
                        progress.toFixed(2)
                    ),
                Status:
                    progress >= 100
                        ? "Exceeded"
                        : progress >= 80
                        ? "Near Limit"
                        : "On Track",
                "Created Date":
                    formatDate(
                        item.created_at
                    ),
                "Updated Date":
                    formatDate(
                        item.updated_at
                    ),
            };
        });

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Budget Register",
                "Configured budgets • each budget kept separately",
                budgetRows,
                [
                    "ID",
                    "Category",
                    "Year",
                    "Budget",
                    "Spent",
                    "Remaining",
                    "Progress %",
                    "Status",
                    "Created Date",
                    "Updated Date",
                ]
            ),
            "Budgets"
        );

        /* =================================================
           SAVINGS
        ================================================= */

        const savingsRows = arr(
            savingsGoals
        ).map((item) => {
            const target = num(
                item.target_amount
            );

            const saved = num(
                item.saved_amount
            );

            const remaining = Math.max(
                0,
                target - saved
            );

            const progress =
                target > 0
                    ? Math.min(
                          100,
                          (saved /
                              target) *
                              100
                      )
                    : 0;

            return {
                ID: item.id ?? "",
                "Goal Name":
                    item.goal_name ||
                    "Savings Goal",
                Target: numMoney(target, currency),
                Saved: numMoney(saved, currency),
                Remaining: numMoney(remaining, currency),
                "Progress %":
                    Number(
                        progress.toFixed(2)
                    ),
                Status:
                    progress >= 100
                        ? "Completed"
                        : "In Progress",
                "Created Date":
                    formatDate(
                        item.created_at
                    ),
                "Updated Date":
                    formatDate(
                        item.updated_at
                    ),
            };
        });

        XLSX.utils.book_append_sheet(
            workbook,
            createProfessionalSheet(
                "BudgetBuddy — Savings Goals",
                "Savings targets and individual progress",
                savingsRows,
                [
                    "ID",
                    "Goal Name",
                    "Target",
                    "Saved",
                    "Remaining",
                    "Progress %",
                    "Status",
                    "Created Date",
                    "Updated Date",
                ]
            ),
            "Savings Goals"
        );

        /* =================================================
           GENERATE FILE
        ================================================= */

        const fileName =
            `BudgetBuddy_${currency}_Financial_Report.xlsx`;

        /*
           IMPORTANT:
           Use SheetJS browser download directly.
           This removes the dependency on file-saver
           for the actual download operation.
        */

        XLSX.writeFile(
            workbook,
            fileName,
            {
                bookType: "xlsx",
                compression: true,
            }
        );

        return true;
    } catch (error) {
        console.error(
            "BudgetBuddy Excel export failed:",
            error
        );

        throw new Error(
            error?.message ||
                "Unable to generate Excel report."
        );
    }
};

/* =========================================================
   SIMPLE INCOME EXPORT
========================================================= */

export const exportIncomeExcel = (
    income = []
) => {
    return exportFinancialExcel(
        income,
        [],
        [],
        [],
        []
    );
};