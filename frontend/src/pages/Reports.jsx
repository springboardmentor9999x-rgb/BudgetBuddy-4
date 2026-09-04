import { useEffect, useMemo, useState } from "react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import { downloadReport, getMonthlyReport } from "../services/analyticsService";
import "./Reports.css";
import { useMonth } from "../context/MonthContext";

const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(v||0);
const date=v=>v?new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

export default function Reports(){
 const {selectedMonth,setSelectedMonth}=useMonth(),[year,month]=selectedMonth.split("-").map(Number),period=useMemo(()=>({month,year}),[month,year]);
 const setPeriod=update=>{const next=update(period);setSelectedMonth(`${next.year}-${String(next.month).padStart(2,"0")}`);};
 const [report,setReport]=useState(),[error,setError]=useState(""),[exporting,setExporting]=useState("");
 useEffect(()=>{setReport();setError("");getMonthlyReport(period).then(setReport).catch(()=>setError("We could not load your statement."));},[period]);
 const rows=useMemo(()=>{if(!report)return[];let balance=report.summary.opening_balance||0;return [...report.transactions].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(x=>{balance+=x.type==="income"?x.amount:-x.amount;return{...x,balance};}).reverse();},[report]);
 const download=async format=>{try{setExporting(format);await downloadReport(format,period);}catch{setError("The statement could not be downloaded. Please try again.");}finally{setExporting("");}};
 if(error)return <div className="reports-message error">{error}</div>;if(!report)return <div className="reports-message">Preparing your statement…</div>;
 return <div className="reports-page statement-page">
  <header className="statement-toolbar"><div><p>Account statement</p><h1>Monthly statement</h1><span>A clear, bank-style record of every credit and debit.</span></div><div className="reports-actions"><label>Month<select value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{new Date(2000,i).toLocaleString("en",{month:"long"})}</option>)}</select></label><label>Year<select value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))}>{[period.year-1,period.year,period.year+1].map(y=><option key={y}>{y}</option>)}</select></label><button onClick={()=>download("pdf")} disabled={!!exporting}><FaFilePdf/>{exporting==="pdf"?"Preparing…":"PDF statement"}</button><button onClick={()=>download("excel")} disabled={!!exporting}><FaFileExcel/>{exporting==="excel"?"Preparing…":"Excel statement"}</button></div></header>
  <article className="bank-statement"><header><div className="statement-brand"><span>BB</span><div><strong>BudgetBuddy</strong><small>PERSONAL FINANCE STATEMENT</small></div></div><div className="statement-period"><small>STATEMENT PERIOD</small><strong>{report.period.label}</strong></div></header>
   <section className="statement-account"><div><small>ACCOUNT HOLDER</small><strong>BudgetBuddy Member</strong><span>Personal finance account</span></div><div><small>STATEMENT REFERENCE</small><strong>BB-{report.period.year}{String(report.period.month).padStart(2,"0")}</strong><span>Generated {new Date().toLocaleDateString("en-IN")}</span></div></section>
   <section className="statement-summary"><div><small>Opening balance</small><strong>{money(report.summary.opening_balance)}</strong></div><div><small>Total credits</small><strong className="credit">+ {money(report.summary.total_income)}</strong></div><div><small>Total debits</small><strong className="debit">− {money(report.summary.total_expenses)}</strong></div><div><small>Closing balance</small><strong>{money(report.summary.closing_balance)}</strong></div></section>
   <div className="statement-table-wrap"><table className="statement-table"><thead><tr><th>Date</th><th>Particulars</th><th className="number">Debit</th><th className="number">Credit</th><th className="number">Balance</th></tr></thead><tbody>{rows.length?rows.map(x=><tr key={`${x.type}-${x.id}`}><td>{date(x.date)}</td><td><strong>{x.label}</strong><span>{x.description||`${x.type} transaction`}</span></td><td className="number debit">{x.type==="expense"?money(x.amount):"—"}</td><td className="number credit">{x.type==="income"?money(x.amount):"—"}</td><td className="number">{money(x.balance)}</td></tr>):<tr><td colSpan="5" className="statement-empty">No transactions were recorded during this statement period.</td></tr>}</tbody></table></div>
   <footer><span>This statement is generated from your BudgetBuddy records.</span><strong>Page 1 of 1</strong></footer>
  </article>
 </div>;
}
