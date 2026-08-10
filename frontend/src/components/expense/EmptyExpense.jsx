function EmptyExpense() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-10 text-center">
      <h2 className="text-2xl font-semibold text-gray-700">
        No Expenses Found
      </h2>

      <p className="text-gray-500 mt-3">
        Add your first expense to start tracking your spending.
      </p>
    </div>
  );
}

export default EmptyExpense;