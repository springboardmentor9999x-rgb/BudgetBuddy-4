function ExpenseStats({ expenses }) {
  const totalExpense = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500">
          Total Expenses
        </p>

        <h2 className="text-3xl font-bold text-red-600 mt-2">
          ₹{totalExpense.toLocaleString("en-IN")}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500">
          Transactions
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {expenses.length}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500">
          Average Expense
        </p>

        <h2 className="text-3xl font-bold mt-2">
          ₹
          {expenses.length
            ? Math.round(
                totalExpense / expenses.length
              ).toLocaleString("en-IN")
            : 0}
        </h2>
      </div>

    </div>
  );
}

export default ExpenseStats;