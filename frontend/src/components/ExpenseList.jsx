import { useState } from "react";
import { FaEdit, FaSave, FaTimes, FaTrashAlt } from "react-icons/fa";

const categories = ["Food & dining", "Transport", "Shopping", "Bills & utilities", "Health", "Entertainment", "Education", "Other"];

function ExpenseList({ expenses, loading, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEditing = (expense) => {
    setEditingId(expense.id);
    setDraft({ category: expense.category, amount: String(expense.amount), description: expense.description || "" });
  };

  const save = async (expense) => {
    if (!draft.description.trim() || !Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0) return;
    await onUpdate(expense, { ...draft, amount: Number(draft.amount), description: draft.description.trim() });
    setEditingId(null);
    setDraft(null);
  };

  if (loading) return <p className="expense-empty">Loading expenses…</p>;
  if (!expenses.length) return <p className="expense-empty">No expenses yet. Add your first transaction above.</p>;

  return <div className="expense-table-wrap"><table className="expense-table"><thead><tr><th>Category</th><th>Bank account</th><th>Note</th><th>Date</th><th>Amount</th><th aria-label="Actions" /></tr></thead><tbody>
    {expenses.map((expense) => {
      const editing = editingId === expense.id;
      return <tr key={expense.id} className={editing ? "expense-editing" : ""}>
        <td>{editing ? <select aria-label="Edit category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select> : <span className="expense-category">{expense.category}</span>}</td>
        <td>{expense.bank_account || "Not recorded"}</td>
        <td>{editing ? <input aria-label="Edit note" value={draft.description} maxLength="500" onChange={(event) => setDraft({ ...draft, description: event.target.value })} /> : expense.description}</td>
        <td>{new Date(expense.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td className="expense-amount">{editing ? <input aria-label="Edit amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} /> : `₹${Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</td>
        <td><div className="expense-actions">{editing ? <><button className="save-expense" title="Save expense" onClick={() => save(expense)}><FaSave /><span>Save</span></button><button className="cancel-expense" title="Cancel editing" onClick={() => { setEditingId(null); setDraft(null); }}><FaTimes /><span>Cancel</span></button></> : <><button className="edit-expense" title="Edit expense" onClick={() => startEditing(expense)}><FaEdit /><span>Edit</span></button><button className="delete-expense" title="Delete expense" onClick={() => onDelete(expense)}><FaTrashAlt /><span>Delete</span></button></>}</div></td>
      </tr>;
    })}
  </tbody></table></div>;
}

export default ExpenseList;
