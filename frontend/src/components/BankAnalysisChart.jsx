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

function BankAnalysisChart({ data, title = "Bank-wise Analysis" }) {
    // data: [{ bank_name, total_income, total_expense, net_change }]
    return (
        <div className="card shadow p-3">
            <h4>{title}</h4>

            {data.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No bank accounts yet</p>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bank_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_income" fill="#22C55E" name="Income" />
                        <Bar dataKey="total_expense" fill="#EF4444" name="Expense" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default BankAnalysisChart;
