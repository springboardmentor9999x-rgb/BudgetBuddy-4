import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

function ExpensePieChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-[420px]">

      <h2 className="text-2xl font-bold mb-6">
        Expense Distribution
      </h2>

      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500">
          No expense data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>

            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />

          </PieChart>
        </ResponsiveContainer>
      )}

    </div>
  );
}

export default ExpensePieChart;