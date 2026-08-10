import { FaArrowTrendUp } from "react-icons/fa6";

function IncomeStats({ incomes }) {
  const totalIncome = incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-500 text-sm">
            Total Income
          </p>

          <h2 className="text-3xl font-bold mt-2 text-green-600">
            ₹{totalIncome.toLocaleString()}
          </h2>
        </div>

        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <FaArrowTrendUp className="text-green-600 text-2xl" />
        </div>

      </div>
    </div>
  );
}

export default IncomeStats;