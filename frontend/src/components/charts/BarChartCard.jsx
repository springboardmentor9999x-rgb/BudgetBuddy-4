import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "../../styles/Charts.css";

function BarChartCard({ dashboard }) {
  const byPeriod = new Map();
  for (const income of dashboard.monthly_income) {
    byPeriod.set(income.period, { month: income.period, income: income.amount, expense: 0 });
  }
  for (const expense of dashboard.monthly_expense) {
    const existing = byPeriod.get(expense.period);
    byPeriod.set(expense.period, { month: expense.period, income: existing?.income || 0, expense: expense.amount });
  }
  const chartData = [...byPeriod.values()].sort((a, b) => a.month.localeCompare(b.month));

  return (

    <div className="chart-card">

      <h3>Monthly Income vs Expense</h3>

      <ResponsiveContainer
        width="100%"
        height={320}
      >

        <BarChart data={chartData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar dataKey="income" fill="var(--success)" radius={[8, 8, 0, 0]} />

          <Bar dataKey="expense" fill="var(--danger)" radius={[8, 8, 0, 0]} />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default BarChartCard;
