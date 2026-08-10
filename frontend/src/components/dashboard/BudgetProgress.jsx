function BudgetProgress({ budgets }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-2xl font-bold mb-6">
        Budget Progress
      </h2>

      {budgets.length === 0 ? (
        <p className="text-gray-500">
          No budgets created.
        </p>
      ) : (
        budgets.map((budget) => (
          <div
            key={budget.category}
            className="mb-6"
          >

            <div className="flex justify-between mb-2">

              <span className="font-semibold">
                {budget.category}
              </span>

              <span>
                ₹{budget.spent.toLocaleString()} /
                ₹{budget.limit.toLocaleString()}
              </span>

            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">

              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    budget.percentage,
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="mt-2 text-sm text-gray-500">

              Remaining:
              ₹{budget.remaining.toLocaleString()} (
              {budget.percentage}% used)

            </div>

          </div>
        ))
      )}

    </div>
  );
}

export default BudgetProgress;