import { useEffect, useState } from "react";
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaArrowTrendUp, FaChartPie, FaFileExcel, FaFilePdf, FaWallet } from "react-icons/fa6";
import { downloadReport, getAnalytics } from "../services/analyticsService";
import "./Reports.css";

const colors = ["#6c4df6", "#0f9f6e", "#ec9a21", "#df3f4f", "#3182f6", "#916eff"];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [exporting, setExporting] = useState("");
  useEffect(() => { getAnalytics().then(setAnalytics).catch(() => setError("We could not load your reports. Please refresh the page.")); }, []);
  if (error) return <div className="reports-message error">{error}</div>;
  if (!analytics) return <div className="reports-message">Loading your reports…</div>;

  const { summary, categories, trend, goals } = analytics;
  const topCategory = [...categories].sort((a, b) => Number(b.total) - Number(a.total))[0];
  const spendRate = summary.total_income ? Math.round((Number(summary.total_expenses) / Number(summary.total_income)) * 100) : 0;
  const insight = summary.savings_rate >= 20 ? "Your saving habit is on a healthy path. Keep directing surplus toward your goals." : summary.net_balance < 0 ? "Your expenses are higher than income. Review the categories below to regain balance." : "There is room to increase your savings. A category budget is a useful next step.";

  const exportFile = async (format) => {
    try {
      setExporting(format);
      await downloadReport(format, period);
    } catch {
      setError(`The ${format.toUpperCase()} report could not be downloaded. Please try again.`);
    } finally {
      setExporting("");
    }
  };

  return <div className="reports-page">
    <header className="reports-hero"><div><p>Financial intelligence</p><h1>Your money, in focus</h1><span>See the patterns behind your spending and make your next financial move with clarity.</span></div><div className="reports-actions"><label>Report month<select value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: Number(event.target.value) }))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleString("en", { month: "long" })}</option>)}</select></label><label>Year<select value={period.year} onChange={(event) => setPeriod((current) => ({ ...current, year: Number(event.target.value) }))}>{[period.year - 1, period.year, period.year + 1].map((year) => <option key={year} value={year}>{year}</option>)}</select></label><button type="button" onClick={() => exportFile("pdf")} disabled={Boolean(exporting)} title="Download PDF report"><FaFilePdf /> {exporting === "pdf" ? "Preparing..." : "Export PDF"}</button><button type="button" onClick={() => exportFile("excel")} disabled={Boolean(exporting)} title="Download Excel report"><FaFileExcel /> {exporting === "excel" ? "Preparing..." : "Export Excel"}</button></div><div className="reports-hero-rate"><span><FaArrowTrendUp /> Savings rate</span><strong>{summary.savings_rate}%</strong><small>{summary.savings_rate >= 20 ? "You are building healthy savings." : "There is room to save more."}</small></div></header>
    <section className="reports-stat-grid"><article className="report-stat balance"><span>Net balance</span><strong>{money(summary.net_balance)}</strong><small>Income minus expenses</small></article><article className="report-stat income"><span>Total income</span><strong>{money(summary.total_income)}</strong><small>Money received</small></article><article className="report-stat expense"><span>Total expenses</span><strong>{money(summary.total_expenses)}</strong><small>Money spent</small></article><article className="report-stat category"><span>Top expense</span><strong>{topCategory?.category || "None"}</strong><small>{topCategory ? money(topCategory.total) : "No expenses yet"}</small></article></section>
    <section className="reports-insight"><span className="reports-insight-icon"><FaArrowTrendUp /></span><div><p>Monthly insight</p><strong>{insight}</strong></div><div className="reports-spend-rate"><span>Income spent</span><b>{spendRate}%</b><i><em style={{ width: `${Math.min(spendRate, 100)}%` }} /></i></div></section>
    <section className="reports-main-grid"><article className="report-chart report-trend"><div className="report-card-heading"><div><span className="report-icon"><FaWallet /></span><div><h2>Cash flow trend</h2><p>Income and spending over recent months.</p></div></div><span className="report-period">Monthly</span></div><ResponsiveContainer width="100%" height={330}><LineChart data={trend}><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={(value) => money(value)} /><Legend /><Line type="monotone" dataKey="income" stroke="#0f9f6e" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="expenses" stroke="#df3f4f" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></article><article className="report-chart report-breakdown"><div className="report-card-heading"><div><span className="report-icon pie"><FaChartPie /></span><div><h2>Where you spend</h2><p>Expense breakdown by category.</p></div></div></div>{categories.length ? <ResponsiveContainer width="100%" height={330}><PieChart><Pie data={categories} dataKey="total" nameKey="category" innerRadius={65} outerRadius={108} paddingAngle={3}>{categories.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /><Legend verticalAlign="bottom" iconType="circle" /></PieChart></ResponsiveContainer> : <p className="reports-empty">No expense data yet.</p>}</article></section>
    <section className="goal-report"><div className="report-card-heading"><div><span className="report-icon goal"><FaArrowTrendUp /></span><div><h2>Savings goals</h2><p>Keep an eye on the progress toward your priorities.</p></div></div><span className="goal-count">{goals.length} active</span></div>{goals.length ? <div className="goal-report-list">{goals.map((goal) => <div key={goal.id} className="goal-report-item"><div><strong>{goal.goal_name}</strong><span>{money(goal.saved_amount)} saved of {money(goal.target_amount)}</span></div><div className="goal-report-track"><span style={{ width: `${goal.progress_percentage}%` }} /></div><b>{goal.progress_percentage.toFixed(0)}%</b></div>)}</div> : <p className="reports-empty compact">Create a savings goal to see progress here.</p>}</section>
  </div>;
}

export default Reports;
