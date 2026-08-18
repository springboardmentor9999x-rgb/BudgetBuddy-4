import { useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaPiggyBank, FaPlus, FaTrashAlt } from "react-icons/fa";
import { contributeToGoal, createGoal, deleteGoal, getGoals } from "../services/goalService";
import "./Goals.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

const normalizeErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  const text = String(detail).trim();
  if (/could not load.*page/i.test(text)) return fallback;
  return text;
};

function Goals() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ goal_name: "", target_amount: "", target_date: "" });
  const [contributions, setContributions] = useState({});
  const [notice, setNotice] = useState(null);

  const loadGoals = useCallback(async () => {
    try {
      setGoals(await getGoals());
    } catch (error) {
      setNotice({ type: "error", message: normalizeErrorMessage(error, "Could not load savings goals. Please refresh the page.") });
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addGoal = async (event) => {
    event.preventDefault();
    try {
      await createGoal({ ...form, target_amount: Number(form.target_amount), target_date: form.target_date || null });
      setForm({ goal_name: "", target_amount: "", target_date: "" });
      await loadGoals(); setNotice({ type: "success", message: "Savings goal created." });
    } catch (error) {
      setNotice({ type: "error", message: normalizeErrorMessage(error, "Could not create this goal.") });
    }
  };
  const contribute = async (goal) => {
    const amount = Number(contributions[goal.id]);
    if (!amount || amount <= 0) return setNotice({ type: "error", message: "Enter a contribution greater than zero." });
    try {
      await contributeToGoal(goal.id, amount);
      setContributions((current) => ({ ...current, [goal.id]: "" }));
      await loadGoals();
      setNotice({ type: "success", message: "Contribution added. Great progress!" });
    } catch (error) {
      setNotice({ type: "error", message: normalizeErrorMessage(error, "Could not add the contribution.") });
    }
  };
  const removeGoal = async (goal) => {
    try {
      await deleteGoal(goal.id);
      await loadGoals();
      setNotice({ type: "success", message: `${goal.goal_name} was deleted.` });
    } catch {
      setNotice({ type: "error", message: "Could not delete this goal. Please try again." });
    }
  };

  return <div className="goals-page">
    {notice && <div className={`goals-notice ${notice.type}`} role="status"><FaCheckCircle /> {notice.message}</div>}
    <header><div><p>Future plans</p><h1>Savings goals</h1><span>Turn your financial priorities into measurable progress.</span></div></header>
    <section className="goals-panel"><div className="goals-panel-heading"><FaPlus /><div><h2>Start a goal</h2><p>Choose a name, target amount, and optional deadline.</p></div></div><form onSubmit={addGoal}><input placeholder="e.g. Emergency fund" value={form.goal_name} onChange={(e) => setForm({ ...form, goal_name: e.target.value })} required /><input type="number" min="0.01" step="0.01" placeholder="Target amount" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required /><input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /><button>Create goal</button></form></section>
    <section className="goals-panel"><div className="goals-panel-heading"><FaPiggyBank /><div><h2>Your progress</h2><p>Contributions update progress automatically.</p></div></div>{!goals.length ? <p className="goals-empty">No goals yet—your first one starts above.</p> : <div className="goals-grid">{goals.map((goal) => <article className="goal-card" key={goal.id}><div className="goal-card-top"><div><h3>{goal.goal_name}</h3><span>{goal.status === "completed" ? "Completed" : goal.target_date ? `Target: ${new Date(`${goal.target_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "No deadline"}</span></div><button onClick={() => removeGoal(goal)} aria-label={`Delete ${goal.goal_name}`}><FaTrashAlt /></button></div><strong>{money(goal.saved_amount)} <small>of {money(goal.target_amount)}</small></strong><div className="goal-progress"><span style={{ width: `${goal.progress_percentage}%` }} /></div><div className="goal-details"><span>{goal.progress_percentage.toFixed(0)}% complete</span><span>{money(goal.remaining_amount)} left</span></div>{goal.status !== "completed" && <div className="contribute"><input type="number" min="0.01" step="0.01" placeholder="Contribution" value={contributions[goal.id] || ""} onChange={(e) => setContributions((current) => ({ ...current, [goal.id]: e.target.value }))} /><button onClick={() => contribute(goal)}>Add</button></div>}</article>)}</div>}</section>
  </div>;
}

export default Goals;
