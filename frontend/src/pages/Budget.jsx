import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaExclamationTriangle, FaPlus, FaTrashAlt, FaWallet } from "react-icons/fa";
import { createBudget, deleteBudget, getBudgetSummary, updateBudget } from "../services/budgetService";
import "./Budget.css";
import { useMonth } from "../context/MonthContext";

const categories = ["Food & dining", "Transport", "Shopping", "Bills & utilities", "Health", "Entertainment", "Education", "Other"];
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
const normalizeError = (error, fallback) => String(error?.response?.data?.detail || fallback).trim();

function Budget() {
  const { selectedMonth: month } = useMonth();
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const loadBudgets = useCallback(async (selectedMonth) => {
    try { setLoading(true); setBudgets(await getBudgetSummary(selectedMonth)); }
    catch (error) { setNotice({ type: "error", message: normalizeError(error, "Could not load budgets. Please refresh the page.") }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBudgets(month); }, [month, loadBudgets]);
  useEffect(() => { if (!notice) return undefined; const timer = window.setTimeout(() => setNotice(null), 4200); return () => window.clearTimeout(timer); }, [notice]);

  const totals = useMemo(() => budgets.reduce((all, budget) => ({ limit: all.limit + Number(budget.amount), spent: all.spent + Number(budget.spent) }), { limit: 0, spent: 0 }), [budgets]);
  const atRisk = budgets.filter((budget) => budget.utilization >= 80);
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const handleAdd = async (event) => {
    event.preventDefault(); setSubmitting(true);
    try { await createBudget({ category, amount: Number(amount), month }); setAmount(""); await loadBudgets(month); setNotice({ type: "success", message: "Budget added successfully." }); }
    catch (error) { setNotice({ type: "error", message: normalizeError(error, "Could not save this budget. Please try again.") }); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async (budget) => {
    try { await deleteBudget(budget.id); await loadBudgets(month); setNotice({ type: "success", message: `${budget.category} budget deleted.` }); }
    catch (error) { setNotice({ type: "error", message: normalizeError(error, "Could not delete this budget. Please try again.") }); }
  };
  const startEditing = (budget) => { setEditingBudget(budget); setEditAmount(String(budget.amount)); };
  const handleUpdate = async (event) => {
    event.preventDefault(); if (!editingBudget) return; setSubmitting(true);
    try { await updateBudget(editingBudget.id, { amount: Number(editAmount) }); setEditingBudget(null); await loadBudgets(month); setNotice({ type: "success", message: "Budget updated successfully." }); }
    catch (error) { setNotice({ type: "error", message: normalizeError(error, "Could not update this budget. Please try again.") }); }
    finally { setSubmitting(false); }
  };

  return <div className="budget-page">
    {notice && <div className={`budget-notice ${notice.type}`} role="status"><FaCheckCircle /> {notice.message}</div>}
    <header className="budget-header"><div><p className="budget-eyebrow">Spending plans</p><h1>Plan your month with confidence</h1><span>Set clear category limits and see exactly where your money is going.</span></div><div className="budget-month">Viewing month<strong>{monthLabel}</strong></div></header>
    <section className="budget-overview"><div className="budget-overview-copy"><span><FaWallet /> {monthLabel}</span><strong>{currency(totals.limit - totals.spent)}</strong><p>{totals.limit ? "available to spend across all planned categories" : "Add a category budget to start planning"}</p></div><div className="budget-overview-meter"><div><span>Monthly plan</span><b>{currency(totals.spent)} of {currency(totals.limit)}</b></div><div className="budget-overview-track"><i style={{ width: `${Math.min(totals.limit ? (totals.spent / totals.limit) * 100 : 0, 100)}%` }} /></div></div></section>
    <section className="budget-stats"><div><span>Total planned</span><strong>{currency(totals.limit)}</strong></div><div><span>Spent this month</span><strong>{currency(totals.spent)}</strong></div><div><span>Remaining</span><strong className={totals.limit - totals.spent < 0 ? "over-budget" : ""}>{currency(totals.limit - totals.spent)}</strong></div></section>
    {!!atRisk.length && <div className="budget-risk" role="alert"><FaExclamationTriangle /><span><strong>{atRisk.length === 1 ? atRisk[0].category : `${atRisk.length} categories`} needs attention.</strong> {atRisk.some((budget) => budget.utilization > 100) ? "A category has exceeded its limit." : "Spending is close to a category limit."}</span></div>}
    <section className="budget-panel budget-create-panel"><div className="budget-panel-heading"><span><FaPlus /></span><div><h2>Create a category limit</h2><p>Choose a category and the maximum you want to spend this month.</p></div></div><form className="budget-form" onSubmit={handleAdd}><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)} required>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Monthly limit<input type="number" min="0.01" step="0.01" placeholder="e.g. 5000" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><button disabled={submitting}>{submitting ? "Saving…" : "Add budget"}</button></form></section>
    {editingBudget && <section className="budget-panel budget-edit-panel"><div className="budget-panel-heading"><span><FaEdit /></span><div><h2>Edit {editingBudget.category} budget</h2><p>Update the limit for {monthLabel}.</p></div></div><form className="budget-form" onSubmit={handleUpdate}><label>Category<input value={editingBudget.category} disabled /></label><label>Monthly limit<input type="number" min="0.01" step="0.01" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} required /></label><div className="budget-edit-actions"><button disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</button><button type="button" className="budget-cancel" onClick={() => setEditingBudget(null)}>Cancel</button></div></form></section>}
    <section className="budget-panel"><div className="budget-panel-heading"><span className="list-icon"><FaWallet /></span><div><h2>Your category budgets</h2><p>These limits use expenses recorded in {monthLabel}.</p></div></div>{loading ? <p className="budget-empty">Loading budgets…</p> : !budgets.length ? <p className="budget-empty">No budgets for this month yet. Add one above to get started.</p> : <div className="budget-grid">{budgets.map((budget) => { const progress = Math.min(budget.utilization, 100); const state = budget.utilization > 100 ? "exceeded" : budget.utilization >= 80 ? "warning" : "healthy"; return <article className={`budget-card ${state}`} key={budget.id}><div className="budget-card-top"><div><span className="budget-card-status">{state === "exceeded" ? "Over budget" : state === "warning" ? "Almost there" : "On track"}</span><h3>{budget.category}</h3><p>{currency(budget.spent)} spent of {currency(budget.amount)}</p></div><div className="budget-card-actions"><button onClick={() => startEditing(budget)} aria-label={`Edit ${budget.category} budget`} title="Edit budget"><FaEdit /></button><button onClick={() => handleDelete(budget)} aria-label={`Delete ${budget.category} budget`} title="Delete budget"><FaTrashAlt /></button></div></div><div className="budget-progress"><span style={{ width: `${progress}%` }} /></div><div className="budget-card-bottom"><strong>{budget.utilization.toFixed(0)}% used</strong><span className={budget.remaining < 0 ? "over-budget" : ""}>{budget.remaining < 0 ? `${currency(Math.abs(budget.remaining))} over` : `${currency(budget.remaining)} left`}</span></div></article>; })}</div>}</section>
  </div>;
}

export default Budget;
