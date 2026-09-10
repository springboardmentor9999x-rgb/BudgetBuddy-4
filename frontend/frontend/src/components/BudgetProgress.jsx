import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney } from "../utils/settings";

function BudgetProgress({ budget = 0, expense = 0 }) {
    const settings = useAppSettings();
    const currency = settings?.currency || "INR";
    const safeBudget = Number(budget) || 0;
    const safeExpense = Number(expense) || 0;
    const raw = safeBudget > 0 ? (safeExpense / safeBudget) * 100 : 0;
    const percentage = Math.min(Math.max(raw, 0), 100);
    const exceeded = safeBudget > 0 && safeExpense > safeBudget;

    return (
        <div className="bb-mini-budget-progress">
            <div className="bb-mini-progress-head">
                <span>{formatMoney(safeExpense, currency)} / {formatMoney(safeBudget, currency)}</span>
                <strong>{raw.toFixed(0)}%</strong>
            </div>
            <div className="budget-progress-track small">
                <div className={`budget-progress-fill ${exceeded ? "budget-progress-fill-danger" : ""}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`bb-mini-check ${exceeded ? "danger" : ""}`}>
                {exceeded ? "!" : "✓"} {exceeded ? "Over budget" : safeBudget ? "Within plan" : "No budget set"}
            </span>
        </div>
    );
}
export default BudgetProgress;
