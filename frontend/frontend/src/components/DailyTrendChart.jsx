import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

function DailyTrendChart({ data, title = "Daily Income / Expense Trend" }) {
    // data: [{ date: "2026-01-01", income, expense, savings }]
    const chartData = data.map((d) => ({
        ...d,
        day: d.date ? d.date.slice(-2) : "",
    }));

    return (
        <div className="card shadow p-3">
            <h4>{title}</h4>

            {chartData.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No data for this period</p>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#22C55E" name="Income" />
                        <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Expense" />
                        <Line type="monotone" dataKey="savings" stroke="#0d6efd" name="Savings" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default DailyTrendChart;
