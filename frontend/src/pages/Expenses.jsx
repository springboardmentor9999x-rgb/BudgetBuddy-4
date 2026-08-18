import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaPlus, FaTrashAlt } from "react-icons/fa";

import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import { createExpense, deleteExpense, getExpenses } from "../services/expenseService";
import { getBudgetSummary } from "../services/budgetService";
import "./Expenses.css";

const BANK_STORAGE_KEY = "budgetbuddy-bank-details";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalExpense = useMemo(
    () => expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0),
    [expenses]
  );

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setExpenses(await getExpenses());
    } catch {
      showToast("error", "Could not load your expenses. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    const savedAccounts = localStorage.getItem(BANK_STORAGE_KEY);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        // Converts the previous single-account format to the new account list.
        setBankAccounts(Array.isArray(parsed) ? parsed : parsed.bankName ? [{ id: "primary", ...parsed }] : []);
      } catch { localStorage.removeItem(BANK_STORAGE_KEY); }
    }
  }, []);

  const handleAdd = async (expense) => {
    let alert = null;
    try {
      const today = new Date();
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const budgets = await getBudgetSummary(month);
      const budget = budgets.find((item) => item.category === expense.category);
      if (budget) {
        const projectedSpent = Number(budget.spent) + Number(expense.amount);
        const projectedUsage = (projectedSpent / Number(budget.amount)) * 100;
        const projectedRemaining = Number(budget.amount) - projectedSpent;
        const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
        if (projectedUsage > 100) alert = { type: "error", message: `Budget exceeded: this ${money.format(expense.amount)} ${expense.category} expense takes you to ${money.format(projectedSpent)} of your ${money.format(budget.amount)} budget (${money.format(Math.abs(projectedRemaining))} over).` };
        else if (projectedUsage >= 80) alert = { type: "warning", message: `Budget alert: ${expense.category} will be ${Math.round(projectedUsage)}% used after this expense. ${money.format(projectedRemaining)} remains.` };
      }
    } catch { /* A budget lookup is optional; the expense can still be saved. */ }

    await createExpense(expense);
    await loadExpenses();
    showToast(alert?.type || "success", alert?.message || "Expense added successfully.");
  };

  const handleDelete = async (expense) => {
    try {
      await deleteExpense(expense.id);
      await loadExpenses();
      showToast("success", `“${expense.category}” was deleted.`);
    } catch (error) {
      showToast("error", error.response?.data?.detail || "Unable to delete this expense.");
    }
  };

  return (
    <div className="expenses-page">
      <header className="expenses-hero">
        <div>
          <p className="expenses-eyebrow">Money out</p>
          <h1>Track your expenses</h1>
          <p>Capture every spend and keep your budget in clear view.</p>
        </div>
        <div className="expenses-total-card">
          <span>This month’s expenses</span>
          <strong>₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <small>{expenses.length} transaction{expenses.length === 1 ? "" : "s"} recorded</small>
        </div>
      </header>

      {toast && (
        <div className={`expense-toast ${toast.type}`} role="status">
          <FaCheckCircle /> {toast.message}
        </div>
      )}

      <section className="expense-panel add-expense-panel">
          <div className="expense-panel-heading">
            <span className="panel-icon"><FaPlus /></span>
            <div><h2>Add an expense</h2><p>Record a payment in a few seconds.</p></div>
          </div>
          <ExpenseForm bankAccounts={bankAccounts} onAdd={handleAdd} />
          {!bankAccounts.length && <p className="expense-bank-hint">Add a bank account from <strong>Accounts</strong> in the sidebar before recording an expense.</p>}
      </section>

      <section className="expense-panel transactions-panel">
        <div className="expense-panel-heading">
          <span className="panel-icon danger"><FaTrashAlt /></span>
          <div><h2>Recent expenses</h2><p>Review, then remove records you no longer need.</p></div>
        </div>
        <ExpenseList expenses={expenses} loading={loading} onDelete={handleDelete} />
      </section>
    </div>
  );
}

export default Expenses;
