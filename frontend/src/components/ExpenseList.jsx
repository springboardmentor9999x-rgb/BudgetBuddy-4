import { FaTrashAlt } from "react-icons/fa";

function ExpenseList({ expenses, loading, onDelete }) {
  if (loading) return <p className="expense-empty">Loading expenses…</p>;
  if (!expenses.length) return <p className="expense-empty">No expenses yet. Add your first transaction above.</p>;

  return <div className="expense-table-wrap"><table className="expense-table"><thead><tr><th>Category</th><th>Bank account</th><th>Note</th><th>Date</th><th>Amount</th><th aria-label="Actions" /></tr></thead><tbody>
    {expenses.map((expense) => <tr key={expense.id}>
      <td><span className="expense-category">{expense.category}</span></td>
      <td>{expense.bank_account || "Not recorded"}</td>
      <td>{expense.description || "—"}</td>
      <td>{new Date(expense.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td className="expense-amount">₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      <td><button className="delete-expense" title="Delete expense" onClick={() => onDelete(expense)}><FaTrashAlt /><span>Delete</span></button></td>
    </tr>)}
  </tbody></table></div>;
}

export default ExpenseList;
