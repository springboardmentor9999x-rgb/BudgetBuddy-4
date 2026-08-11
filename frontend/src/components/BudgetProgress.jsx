import "../styles/BudgetProgress.css";

function BudgetProgress() {
  const totalBudget = 50000;
  const spent = 36000;

  const percentage = (spent / totalBudget) * 100;

  return (
    <div className="budget-card">

      <h3>Monthly Budget</h3>

      <div className="budget-values">

        <span>₹{spent.toLocaleString()}</span>

        <span>₹{totalBudget.toLocaleString()}</span>

      </div>

      <div className="progress-bar">

        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p>

        <strong>
          {Math.round(percentage)}%
        </strong>{" "}
        of your monthly budget has been used.

      </p>

    </div>
  );
}

export default BudgetProgress;