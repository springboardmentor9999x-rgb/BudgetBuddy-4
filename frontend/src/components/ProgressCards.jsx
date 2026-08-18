import { useEffect, useState } from "react";
import "../styles/ProgressCards.css";
import { FaWallet, FaPiggyBank } from "react-icons/fa";
import { getBudgetSummary } from "../services/budgetService";
import { getGoals } from "../services/goalService";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

function ProgressCards() {
  const [data, setData] = useState({ budget: null, goal: null });
  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([getBudgetSummary(month), getGoals()]).then(([budgets, goals]) => {
      const budget = budgets.reduce((total, item) => ({ amount: total.amount + Number(item.amount), spent: total.spent + Number(item.spent) }), { amount: 0, spent: 0 });
      setData({ budget: budget.amount ? { ...budget, percentage: Math.min((budget.spent / budget.amount) * 100, 100) } : null, goal: goals.find((item) => item.status !== "completed") || goals[0] || null });
    }).catch(() => setData({ budget: null, goal: null }));
  }, []);

  return <div className="progress-container">
    <div className="progress-card"><div className="progress-header"><div className="progress-icon budget-icon"><FaWallet /></div><div><h3>Monthly Budget</h3><p>Current month utilization</p></div></div>{data.budget ? <><div className="progress-value">{money(data.budget.spent)} <span>/ {money(data.budget.amount)}</span></div><div className="progress-bar"><div className="progress-fill budget-fill" style={{ width: `${data.budget.percentage}%` }} /></div><div className="progress-footer"><span>{data.budget.percentage.toFixed(0)}% Used</span><span>{money(data.budget.amount - data.budget.spent)} Left</span></div></> : <p className="progress-empty">Set a budget to track your monthly spending.</p>}</div>
    <div className="progress-card"><div className="progress-header"><div className="progress-icon savings-icon"><FaPiggyBank /></div><div><h3>Savings Goal</h3><p>Current progress</p></div></div>{data.goal ? <><div className="progress-value">{money(data.goal.saved_amount)} <span>/ {money(data.goal.target_amount)}</span></div><div className="progress-bar"><div className="progress-fill savings-fill" style={{ width: `${data.goal.progress_percentage}%` }} /></div><div className="progress-footer"><span>{data.goal.progress_percentage.toFixed(0)}% Completed</span><span>{money(data.goal.remaining_amount)} Remaining</span></div></> : <p className="progress-empty">Create a savings goal to see progress here.</p>}</div>
  </div>;
}

export default ProgressCards;
