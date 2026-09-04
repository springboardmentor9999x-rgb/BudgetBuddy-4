import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaMoneyBillWave, FaSearch, FaUniversity, FaWallet } from "react-icons/fa";
import IncomeForm from "../components/IncomeForm";
import IncomeList from "../components/IncomeList";
import { createIncome, deleteIncome, getIncome } from "../services/incomeService";
import "../styles/Income.css";
import { useMonth } from "../context/MonthContext";

function Income() {
  const { selectedMonth } = useMonth();
  const [income, setIncome] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadIncome = useCallback(async () => {
    setLoading(true);
    try {
      setIncome(await getIncome(selectedMonth));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadIncome().catch(() => notify("error", "Could not load income records."));
    try {
      const stored = JSON.parse(localStorage.getItem("budgetbuddy-bank-details") || "[]");
      setAccounts(Array.isArray(stored) ? stored : stored.bankName ? [{ id: "primary", ...stored }] : []);
    } catch {
      setAccounts([]);
    }
  }, [loadIncome]);

  const handleAdd = async (item) => {
    await createIncome(item);
    await loadIncome();
    notify("success", "Income added successfully.");
  };

  const handleDelete = async (item) => {
    try {
      await deleteIncome(item.id);
      await loadIncome();
      notify("success", "Income record deleted.");
    } catch (error) {
      notify("error", error.response?.data?.detail || "Unable to delete income.");
    }
  };

  const filtered = useMemo(() => income.filter((item) => item.source.toLowerCase().includes(search.toLowerCase())), [income, search]);
  const total = useMemo(() => income.reduce((sum, item) => sum + Number(item.amount), 0), [income]);
  const money = `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return <div className="income-container">
    {toast && <div className={`income-toast ${toast.type}`} role="status"><FaCheckCircle /> {toast.message}</div>}
    <header className="income-header">
      <div className="income-title"><p className="income-eyebrow">Cash flow</p><h1>Income manager</h1><p>Track every payment and keep your earnings organized.</p></div>
      <div className="income-header-total"><span>Income recorded</span><strong>{money}</strong></div>
    </header>
    <section className="income-stats">
      <div className="stat-card green"><span className="income-stat-icon"><FaWallet /></span><div><h3>Total income</h3><h2>{money}</h2></div></div>
      <div className="stat-card blue"><span className="income-stat-icon"><FaMoneyBillWave /></span><div><h3>Income records</h3><h2>{income.length}</h2></div></div>
      <div className="stat-card orange"><span className="income-stat-icon"><FaUniversity /></span><div><h3>Linked accounts</h3><h2>{accounts.length}</h2></div></div>
    </section>
    <IncomeForm accounts={accounts} onAdd={handleAdd} />
    {!accounts.length && <p className="income-bank-hint">Add a bank account from <strong>Accounts</strong> in the sidebar before recording income.</p>}
    <section className="income-records">
      <div className="income-records-header"><div><h2>Income history</h2><p>{loading ? "Loading records…" : `${filtered.length} record${filtered.length === 1 ? "" : "s"} shown`}</p></div><label className="income-search"><FaSearch /><input type="search" aria-label="Search income source" placeholder="Search income source" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
      <div className="table-card">{loading ? <p className="income-empty">Loading your income records…</p> : <IncomeList income={filtered} onDelete={handleDelete} />}</div>
    </section>
  </div>;
}

export default Income;
