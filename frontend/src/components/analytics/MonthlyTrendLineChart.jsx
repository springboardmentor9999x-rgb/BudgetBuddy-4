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
  // Prepare chart data
  const chartData = [...(data || [])]
    .sort((a, b) => {
      const dateA = new Date(
        Number(a.year),
        Number(a.month) - 1
      );

      const dateB = new Date(
        Number(b.year),
        Number(b.month) - 1
      );

      return dateA - dateB;
    })
    .map((item) => ({
      ...item,

      monthLabel: `${item.month}/${item.year}`,

      income: Number(item.income || 0),

      expenses: Number(
        item.expenses ??
        item.expense ??
        item.total_expenses ??
        0
      ),
    }));

  // Format currency
  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-4">
        <p className="font-bold text-gray-900 mb-3">
          {label}
        </p>

        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-8 mb-2"
          >
            <span
              className="font-medium"
              style={{
                color: entry.color,
              }}
            >
              {entry.name}
            </span>

            <span className="font-semibold text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      {chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center">
          <p className="text-gray-500">
            No monthly data available.
          </p>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={360}
        >
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="monthLabel"
              tick={{
                fontSize: 14,
              }}
              tickMargin={10}
            />

            <YAxis
              tick={{
                fontSize: 14,
              }}
              tickFormatter={(value) =>
                `₹${Number(value).toLocaleString("en-IN")}`
              }
            />

            <Tooltip
              content={<CustomTooltip />}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
            />

            {/* Income */}
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
              connectNulls
            />

            {/* Expenses */}
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default MonthlyTrendLineChart;