import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function MonthlyTrendLineChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: `${item.month}/${item.year}`,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        Monthly Income & Expenses
      </h2>

      {data.length === 0 ? (
        <p className="text-gray-500">
          No monthly data available.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="monthLabel" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default MonthlyTrendLineChart;