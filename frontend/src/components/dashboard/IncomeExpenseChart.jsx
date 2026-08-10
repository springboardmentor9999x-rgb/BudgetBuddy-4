import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

function IncomeExpenseChart({ dashboard }) {
  const data = [
    {
      name: "Finance",
      Income: dashboard.total_income,
      Expense: dashboard.total_expense,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-[420px]">

      <h2 className="text-2xl font-bold mb-6">
        Income vs Expense
      </h2>

      <ResponsiveContainer width="100%" height="90%">

        <BarChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="Income"
            fill="#22c55e"
            radius={[8, 8, 0, 0]}
          />

          <Bar
            dataKey="Expense"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}

export default IncomeExpenseChart;