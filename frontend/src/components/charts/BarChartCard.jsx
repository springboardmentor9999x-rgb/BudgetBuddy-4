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

const monthNames = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function BarChartCard({ dashboard }) {

  const chartData = [];

  dashboard.monthly_income.forEach((income) => {

    chartData.push({
      month: monthNames[income.month],
      income: income.amount,
      expense: 0,
    });

  });

  dashboard.monthly_expense.forEach((expense) => {

    const existing = chartData.find(
      (item) => item.month === monthNames[expense.month]
    );

    if (existing) {

      existing.expense = expense.amount;

    } else {

      chartData.push({
        month: monthNames[expense.month],
        income: 0,
        expense: expense.amount,
      });

    }

  });

  chartData.sort(
    (a, b) =>
      monthNames.indexOf(a.month) -
      monthNames.indexOf(b.month)
  );

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

          <Bar
            dataKey="income"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
          />

          <Bar
            dataKey="expense"
            fill="#EF4444"
            radius={[8, 8, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default BarChartCard;