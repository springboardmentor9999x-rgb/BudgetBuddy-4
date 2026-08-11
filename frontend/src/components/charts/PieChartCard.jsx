import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import "../../styles/Charts.css";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#84CC16",
];

function PieChartCard({ dashboard }) {

  const chartData = dashboard.expense_categories.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  return (
    <div className="chart-card">

      <h3>Expense Categories</h3>

      <ResponsiveContainer
        width="100%"
        height={320}
      >

        <PieChart>

          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label
          >

            {chartData.map((entry, index) => (

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

    </div>
  );
}

export default PieChartCard;