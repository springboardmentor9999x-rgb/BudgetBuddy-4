import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney } from "../utils/settings";

function formatAmount(value, currency) {
    return formatMoney(value, currency);
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-IN");
}

function RecentExpense({ expense = [] }) {
    const settings = useAppSettings();
    const currency = settings?.currency || "INR";
    const items = [...expense]
        .sort(
            (a, b) =>
                new Date(b.transaction_date || b.created_at || 0) -
                new Date(a.transaction_date || a.created_at || 0)
        )
        .slice(0, 5);

    return (
        <section className="card shadow-sm border-0 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                    <p className="dashboard-eyebrow mb-1">RECENT</p>
                    <h3 className="mb-1">Recent Expenses</h3>
                    <p className="text-muted mb-0">Your latest spending entries.</p>
                </div>
                <span className="badge text-bg-danger">{items.length}</span>
            </div>

            {items.length === 0 ? (
                <div className="text-center text-muted py-4">
                    No recent expenses.
                </div>
            ) : (
                <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.category || "Expense"}</strong>
                                        <div className="small text-muted">
                                            {item.description || "No description"}
                                        </div>
                                    </td>
                                    <td className="text-danger fw-bold">
                                        -{formatAmount(item.amount, currency)}
                                    </td>
                                    <td>{formatDate(item.transaction_date || item.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}


export default RecentExpense;
