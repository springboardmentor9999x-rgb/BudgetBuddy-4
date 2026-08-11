import { useEffect, useState } from "react";
import { FaBuilding, FaPlus, FaTrashAlt } from "react-icons/fa";
import "./Accounts.css";

const STORAGE_KEY = "budgetbuddy-bank-details";
const blankAccount = { bankName: "", accountHolder: "", lastFour: "" };

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(blankAccount);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setAccounts(Array.isArray(parsed) ? parsed : parsed.bankName ? [{ id: "primary", ...parsed }] : []);
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  const saveAccounts = (next, message) => {
    setAccounts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const addAccount = (event) => {
    event.preventDefault();
    const account = { ...form, id: crypto.randomUUID() };
    saveAccounts([...accounts, account], "Bank account added successfully.");
    setForm(blankAccount);
  };

  const removeAccount = (id) => saveAccounts(accounts.filter((account) => account.id !== id), "Bank account removed.");

  return <div className="accounts-page">
    <header className="accounts-header"><div><p>Payment sources</p><h1>Bank accounts</h1><span>Add the accounts you use for everyday expenses.</span></div></header>
    {notice && <div className="accounts-notice">{notice}</div>}
    <div className="accounts-grid">
      <section className="accounts-panel"><div className="accounts-title"><FaPlus /><div><h2>Add a bank account</h2><p>Only the last four digits are saved.</p></div></div>
        <form className="account-form" onSubmit={addAccount}>
          <label>Bank name<input required value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="HDFC Bank" /></label>
          <label>Account holder<input required value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="Your full name" /></label>
          <label>Last 4 digits<input required inputMode="numeric" minLength="4" maxLength="4" pattern="[0-9]{4}" value={form.lastFour} onChange={(e) => setForm({ ...form, lastFour: e.target.value.replace(/\D/g, "") })} placeholder="1234" /></label>
          <button type="submit"><FaPlus /> Add account</button>
        </form>
      </section>
      <section className="accounts-panel"><div className="accounts-title"><FaBuilding /><div><h2>Your accounts</h2><p>Select one whenever you add an expense.</p></div></div>
        {accounts.length ? <div className="accounts-list">{accounts.map((account) => <article className="account-item" key={account.id}><div><strong>{account.bankName}</strong><span>{account.accountHolder}</span><b>•••• {account.lastFour}</b></div><button onClick={() => removeAccount(account.id)} title="Remove account"><FaTrashAlt /></button></article>)}</div> : <p className="accounts-empty">No bank accounts added yet.</p>}
      </section>
    </div>
  </div>;
}

export default Accounts;
