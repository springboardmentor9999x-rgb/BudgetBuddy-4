function SavingsProgressBar({ goals }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        Savings Progress
      </h2>

      {goals.length === 0 ? (
        <p className="text-gray-500">
          No savings goals available.
        </p>
      ) : (
        <div className="space-y-7">
          {goals.map((goal) => {
            const percentage = Math.min(
              Math.max(Number(goal.percentage) || 0, 0),
              100
            );

            return (
              <div key={goal.id}>
                {/* Title + Percentage */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {goal.title}
                  </span>

                  <span className="text-gray-600 font-medium">
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                {/* Current / Target Amount */}
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>
                    ₹{Number(goal.current_amount || 0).toLocaleString("en-IN")}
                  </span>

                  <span>
                    ₹{Number(goal.target_amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SavingsProgressBar;