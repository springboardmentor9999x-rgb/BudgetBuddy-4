import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import IncomeForm from "../components/IncomeForm";
import IncomeList from "../components/IncomeList";
import { createIncome, deleteIncome, getIncome } from "../services/incomeService";
import "../styles/Income.css";

function Income() {
  const [income, setIncome] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const notify = (type, message) => { setToast({ type, message }); window.setTimeout(() => setToast(null), 3500); };
  const loadIncome = async () => { setIncome(await getIncome()); };

  useEffect(() => {
    loadIncome().catch(() => notify("error", "Could not load income records."));
    try { const stored = JSON.parse(localStorage.getItem("budgetbuddy-bank-details") || "[]"); setAccounts(Array.isArray(stored) ? stored : stored.bankName ? [{ id: "primary", ...stored }] : []); } catch { setAccounts([]); }
  }, []);

  const handleAdd = async (item) => { await createIncome(item); await loadIncome(); notify("success", "Income added successfully."); };
  const handleDelete = async (item) => { try { await deleteIncome(item.id); await loadIncome(); notify("success", "Income record deleted."); } catch (error) { notify("error", error.response?.data?.detail || "Unable to delete income."); } };
  const filtered = useMemo(() => income.filter((item) => item.source.toLowerCase().includes(search.toLowerCase())), [income, search]);
  const total = useMemo(() => income.reduce((sum, item) => sum + Number(item.amount), 0), [income]);

  return <div className="income-container">
    {toast && <div className={`income-toast ${toast.type}`} role="status"><FaCheckCircle /> {toast.message}</div>}
    <div className="income-header"><div className="income-title"><h1>Income Manager</h1><p>Track income and choose the account where it was received.</p></div></div>
    <div className="income-stats"><div className="stat-card green"><h3>Total Income</h3><h2>₹{total.toLocaleString("en-IN")}</h2></div><div className="stat-card blue"><h3>Total Records</h3><h2>{income.length}</h2></div><div className="stat-card orange"><h3>Bank Accounts</h3><h2>{accounts.length}</h2></div></div>
    <IncomeForm accounts={accounts} onAdd={handleAdd} />
    {!accounts.length && <p className="income-bank-hint">Add a bank account from <strong>Accounts</strong> in the sidebar before recording income.</p>}
    <div className="search-box"><input type="text" placeholder="Search income source..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <div className="table-card"><IncomeList income={filtered} onDelete={handleDelete} /></div>
  </div>;
}
export default Income;
