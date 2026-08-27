import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

const categories = ["Food & dining", "Transport", "Shopping", "Bills & utilities", "Health", "Entertainment", "Education", "Other"];

function ExpenseForm({ bankAccounts, onAdd }) {
  const [category, setCategory] = useState(categories[0]);
  const [selectedBank, setSelectedBank] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedBank((current) => bankAccounts.some((account) => account.id === current) ? current : "");
  }, [bankAccounts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!description.trim()) {
      setError("Note is required.");
      return;
    }
    try {
      setSaving(true);
      const account = bankAccounts.find((item) => item.id === selectedBank);
      await onAdd({ category, amount: parsedAmount, description: description.trim(), bank_account: `${account.bankName} •••• ${account.lastFour}` });
      setAmount("");
      setDescription("");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add this expense. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={handleSubmit} className="expense-form">
    <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
    <label>Bank account<select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} disabled={!bankAccounts.length} required><option value="">{bankAccounts.length ? "Select bank account" : "Add bank details first"}</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.bankName} •••• {account.lastFour}</option>)}</select></label>
    <label className="expense-description">Note<input type="text" maxLength="500" placeholder="e.g. Weekly groceries" value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
    {error && <p className="expense-form-error">{error}</p>}
    <button type="submit" disabled={saving || !selectedBank}><FaPlus /> {saving ? "Adding…" : "Add expense"}</button>
  </form>;
}

export default ExpenseForm;
