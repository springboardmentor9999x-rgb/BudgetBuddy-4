// frontend/src/utils/reportData.js

const safeArray = (value) => {
    return Array.isArray(value) ? value : [];
};

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const getDateObject = (...values) => {
    for (const value of values) {
        if (!value) continue;

        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
};

const formatDate = (date) => {
    if (!date) return "";

    return date.toLocaleDateString("en-IN");
};

const formatTime = (date) => {
    if (!date) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const isoDate = (date) => {
    if (!date) return "";

    return date.toISOString();
};

export const getBankName = (bankAccounts, bankAccountId) => {
    if (
        bankAccountId === null ||
        bankAccountId === undefined ||
        bankAccountId === ""
    ) {
        return "Unlinked";
    }

    const bank = safeArray(bankAccounts).find(
        (item) => String(item.id) === String(bankAccountId)
    );

    return bank?.bank_name || bank?.name || "Unlinked";
};


/*
=========================================================
TRANSACTION ROWS
=========================================================
*/

export function buildTransactionRows(
    income = [],
    expense = [],
    bankAccounts = []
) {
    const incomeRows = safeArray(income).map((item) => {
        const transactionDate = getDateObject(
            item.transaction_date,
            item.created_at
        );

        const createdDate = getDateObject(item.created_at);

        return {
            Type: "Income",
            ID: item.id ?? "",
            Source: item.source || "",
            Category: item.category || "General",
            Description: item.description || "",
            Bank: getBankName(
                bankAccounts,
                item.bank_account_id
            ),
            Amount: toNumber(item.amount),

            "Transaction Date": formatDate(transactionDate),
            "Transaction Time": formatTime(transactionDate),

            "Created Date": formatDate(createdDate),
            "Created Time": formatTime(createdDate),

            Transaction_DateTime: isoDate(transactionDate),
            Created_DateTime: isoDate(createdDate),
        };
    });

    const expenseRows = safeArray(expense).map((item) => {
        const transactionDate = getDateObject(
            item.transaction_date,
            item.created_at
        );

        const createdDate = getDateObject(item.created_at);

        return {
            Type: "Expense",
            ID: item.id ?? "",
            Source: "",
            Category: item.category || "General",
            Description: item.description || "",
            Bank: getBankName(
                bankAccounts,
                item.bank_account_id
            ),
            Amount: toNumber(item.amount),

            "Transaction Date": formatDate(transactionDate),
            "Transaction Time": formatTime(transactionDate),

            "Created Date": formatDate(createdDate),
            "Created Time": formatTime(createdDate),

            Transaction_DateTime: isoDate(transactionDate),
            Created_DateTime: isoDate(createdDate),
        };
    });

    return [...incomeRows, ...expenseRows].sort(
        (a, b) =>
            new Date(b.Transaction_DateTime || 0) -
            new Date(a.Transaction_DateTime || 0)
    );
}


/*
=========================================================
INCOME
=========================================================
*/

export function buildIncomeRows(income = [], bankAccounts = []) {
    return safeArray(income).map((item) => {
        const transactionDate = getDateObject(
            item.transaction_date,
            item.created_at
        );

        const createdDate = getDateObject(item.created_at);

        return {
            ID: item.id ?? "",
            Source: item.source || "",
            Category: item.category || "General",
            Description: item.description || "",
            Amount: toNumber(item.amount),

            Bank: getBankName(
                bankAccounts,
                item.bank_account_id
            ),

            "Transaction Date": formatDate(transactionDate),
            "Transaction Time": formatTime(transactionDate),

            "Created Date": formatDate(createdDate),
            "Created Time": formatTime(createdDate),
        };
    });
}


/*
=========================================================
EXPENSE
=========================================================
*/

export function buildExpenseRows(expense = [], bankAccounts = []) {
    return safeArray(expense).map((item) => {
        const transactionDate = getDateObject(
            item.transaction_date,
            item.created_at
        );

        const createdDate = getDateObject(item.created_at);

        return {
            ID: item.id ?? "",
            Category: item.category || "General",
            Description: item.description || "",
            Amount: toNumber(item.amount),

            Bank: getBankName(
                bankAccounts,
                item.bank_account_id
            ),

            "Transaction Date": formatDate(transactionDate),
            "Transaction Time": formatTime(transactionDate),

            "Created Date": formatDate(createdDate),
            "Created Time": formatTime(createdDate),
        };
    });
}


/*
=========================================================
BANK ACCOUNTS
=========================================================
*/

export function buildBankRows(bankAccounts = []) {
    return safeArray(bankAccounts).map((bank) => {
        const createdDate = getDateObject(bank.created_at);

        const updatedDate = getDateObject(bank.updated_at);

        return {
            ID: bank.id ?? "",
            "Bank Name":
                bank.bank_name ||
                bank.name ||
                "",

            "Account Holder":
                bank.account_holder_name ||
                "",

            "Account Number":
                bank.account_number ||
                bank.masked_account_number ||
                "",

            "IFSC Code":
                bank.ifsc_code ||
                "",

            "Account Type":
                bank.account_type ||
                "Savings",

            "Opening Balance":
                toNumber(bank.opening_balance),

            "Current Balance":
                toNumber(bank.balance),

            Status:
                bank.status ||
                "active",

            "Created Date":
                formatDate(createdDate),

            "Created Time":
                formatTime(createdDate),

            "Updated Date":
                formatDate(updatedDate),

            "Updated Time":
                formatTime(updatedDate),
        };
    });
}


/*
=========================================================
BUDGETS
=========================================================
*/

export function buildBudgetRows(budgets = []) {
    return safeArray(budgets).map((budget) => {
        const createdDate = getDateObject(
            budget.created_at
        );

        const updatedDate = getDateObject(
            budget.updated_at
        );

        const amount = toNumber(
            budget.budget_amount ??
            budget.amount
        );

        return {
            ID: budget.id ?? "",

            Category:
                budget.category ||
                "General",

            Year:
                budget.budget_year ||
                "",

            "Budget Amount":
                amount,

            "Created Date":
                formatDate(createdDate),

            "Created Time":
                formatTime(createdDate),

            "Updated Date":
                formatDate(updatedDate),

            "Updated Time":
                formatTime(updatedDate),
        };
    });
}


/*
=========================================================
SAVINGS GOALS
=========================================================
*/

export function buildSavingsRows(savingsGoals = []) {
    return safeArray(savingsGoals).map((goal) => {
        const target = toNumber(
            goal.target_amount
        );

        const saved = toNumber(
            goal.saved_amount
        );

        const remaining = Math.max(
            0,
            target - saved
        );

        const progress =
            target > 0
                ? Math.min(
                      100,
                      (saved / target) * 100
                  )
                : 0;

        const createdDate = getDateObject(
            goal.created_at
        );

        const updatedDate = getDateObject(
            goal.updated_at
        );

        return {
            ID: goal.id ?? "",

            "Goal Name":
                goal.goal_name ||
                "Savings Goal",

            "Target Amount":
                target,

            "Saved Amount":
                saved,

            "Remaining Amount":
                remaining,

            "Progress %":
                Number(progress.toFixed(2)),

            "Created Date":
                formatDate(createdDate),

            "Created Time":
                formatTime(createdDate),

            "Updated Date":
                formatDate(updatedDate),

            "Updated Time":
                formatTime(updatedDate),
        };
    });
}


/*
=========================================================
SUMMARY
=========================================================
*/

export function buildReportSummary({
    income = [],
    expense = [],
    budgets = [],
    savingsGoals = [],
    bankAccounts = [],
}) {
    const totalIncome = safeArray(income).reduce(
        (sum, item) =>
            sum + toNumber(item.amount),
        0
    );

    const totalExpense = safeArray(expense).reduce(
        (sum, item) =>
            sum + toNumber(item.amount),
        0
    );

    const totalBudget = safeArray(budgets).reduce(
        (sum, item) =>
            sum +
            toNumber(
                item.budget_amount ??
                item.amount
            ),
        0
    );

    const totalSaved = safeArray(savingsGoals).reduce(
        (sum, item) =>
            sum +
            toNumber(item.saved_amount),
        0
    );

    const bankBalance = safeArray(bankAccounts).reduce(
        (sum, item) =>
            sum + toNumber(item.balance),
        0
    );

    return {
        "Total Income":
            totalIncome,

        "Total Expense":
            totalExpense,

        "Available Balance":
            totalIncome - totalExpense,

        "Total Budget":
            totalBudget,

        "Total Saved":
            totalSaved,

        "Bank Balance":
            bankBalance,

        "Income Records":
            safeArray(income).length,

        "Expense Records":
            safeArray(expense).length,

        "Budget Records":
            safeArray(budgets).length,

        "Savings Goals":
            safeArray(savingsGoals).length,

        "Bank Accounts":
            safeArray(bankAccounts).length,

        "Report Generated":
            new Date().toLocaleString("en-IN"),
    };
}


// Backward compatibility
export const buildReportRows = buildTransactionRows;