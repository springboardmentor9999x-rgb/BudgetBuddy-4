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
        <div className="space-y-6">
          {goals.map((goal) => (
            <div key={goal.id}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">
                  {goal.title}
                </span>

                <span className="text-gray-600">
                  {goal.percentage}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      goal.percentage,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>
                  ₹{goal.current_amount}
                </span>

                <span>
                  ₹{goal.target_amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavingsProgressBar;