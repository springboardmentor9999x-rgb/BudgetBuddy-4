import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney } from "../utils/settings";

function ProgressCard({
    budget = 0,
    spent = 0,
    remaining = 0,
    percentage,
    exceeded = false,
}) {
    const settings = useAppSettings();
    const currency = settings?.currency || "INR";
    const safeBudget = Number(budget) || 0;
    const safeSpent = Number(spent) || 0;
    const safeRemaining = Number(remaining);
    const safePercentage =
        Number.isFinite(Number(percentage))
            ? Number(percentage)
            : safeBudget > 0
                ? (safeSpent / safeBudget) * 100
                : 0;

    // The visual bar must never become wider than the card,
    // but the text can still show that the user exceeded the budget.
    const barWidth = Math.min(Math.max(safePercentage, 0), 100);

    return (
        <section className="budget-progress-card">
            <div className="budget-progress-header">
                <div>
                    <p className="dashboard-eyebrow">BUDGET</p>
                    <h3>Budget Progress</h3>
                </div>

                <span
                    className={
                        exceeded
                            ? "budget-status budget-status-danger"
                            : "budget-status budget-status-ok"
                    }
                >
                    {safeBudget <= 0
                        ? "No budget set"
                        : exceeded
                            ? "Budget exceeded"
                            : "On track"}
                </span>
            </div>

            <div className="budget-progress-values">
                <strong>
                    {formatMoney(safeSpent, currency)}
                </strong>

                <span>
                    of {formatMoney(safeBudget, currency)}
                </span>

                <span className="budget-progress-percent">
                    {safePercentage.toFixed(0)}%
                </span>
            </div>

            <div
                className="budget-progress-track"
                aria-label={`Budget used ${safePercentage.toFixed(0)} percent`}
            >
                <div
                    className={`budget-progress-fill ${
                        exceeded ? "budget-progress-fill-danger" : ""
                    }`}
                    style={{ width: `${barWidth}%` }}
                />
            </div>

            <div className="budget-progress-footer">
                {safeBudget <= 0 ? (
                    <span>Create a budget to start tracking progress.</span>
                ) : exceeded ? (
                    <span>
                        Over budget by {formatMoney(Math.abs(safeRemaining), currency)}
                    </span>
                ) : (
                    <span>
                        {formatMoney(Math.max(safeRemaining, 0), currency)} remaining
                    </span>
                )}

                <span>Updates automatically when you return to Dashboard.</span>
            </div>
        </section>
    );
}

export default ProgressCard;
