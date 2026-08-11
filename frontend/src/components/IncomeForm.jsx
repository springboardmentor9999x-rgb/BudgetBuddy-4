import { useEffect, useState } from "react";

function IncomeForm({ accounts, onAdd }) {
  const [source, setSource] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [accountId, setAccountId] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => setAccountId((current) => accounts.some((account) => account.id === current) ? current : ""), [accounts]);
  const submit = async (event) => { event.preventDefault(); setError(""); const account = accounts.find((item) => item.id === accountId); try { setSaving(true); await onAdd({ source, amount: Number(amount), description: description || null, bank_account: `${account.bankName} •••• ${account.lastFour}` }); setSource(""); setAmount(""); setDescription(""); setAccountId(""); } catch (requestError) { setError(requestError.response?.data?.detail || "Unable to add income."); } finally { setSaving(false); } };
  return <div className="form-card"><h2>Add New Income</h2><form className="income-form" onSubmit={submit}>
    <input placeholder="Income source" value={source} onChange={(e) => setSource(e.target.value)} required />
    <input type="number" min="0.01" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
    <select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={!accounts.length} required><option value="">{accounts.length ? "Select bank account" : "Add bank details first"}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bankName} •••• {account.lastFour}</option>)}</select>
    <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
    {error && <p className="income-form-error">{error}</p>}<button type="submit" disabled={saving || !accountId}>{saving ? "Adding..." : "Add Income"}</button>
  </form></div>;
}
export default IncomeForm;
