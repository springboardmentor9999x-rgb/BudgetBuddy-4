function IncomeList({ income, onDelete }) {
  return <table className="income-table"><thead><tr><th>#</th><th>Income Source</th><th>Bank Account</th><th>Amount</th><th>Description</th><th>Action</th></tr></thead><tbody>{income.length === 0 ? <tr><td colSpan="6" className="empty">No income records found.</td></tr> : income.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.source}</strong></td><td>{item.bank_account || "Not recorded"}</td><td className="income-amount">₹{Number(item.amount).toLocaleString("en-IN")}</td><td>{item.description || "-"}</td><td><button className="delete-btn" onClick={() => onDelete(item)}>Delete</button></td></tr>)}</tbody></table>;
}
export default IncomeList;
