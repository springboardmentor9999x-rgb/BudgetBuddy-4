import { useEffect, useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCalendarAlt, FaFilter, FaReceipt, FaSearch, FaSyncAlt } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { getIncome } from "../services/incomeService";
import { getExpense } from "../services/expenseService";
import { getBankAccounts } from "../services/bankAccountService";
import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney, formatDateTime } from "../utils/settings";
import "../styles/transactionHistory.css";

const safe=(v)=>Array.isArray(v)?v:[];
const num=(v)=>Number.isFinite(Number(v))?Number(v):0;
const dateText=(v,format)=>{if(!v)return "-";const d=new Date(v);if(Number.isNaN(d.getTime()))return "-";if(format==="YYYY-MM-DD")return d.toISOString().slice(0,10);const dd=String(d.getDate()).padStart(2,"0"),mm=String(d.getMonth()+1).padStart(2,"0"),yy=d.getFullYear();return format==="MM/DD/YYYY"?`${mm}/${dd}/${yy}`:`${dd}/${mm}/${yy}`};
const timeText=(v)=>{if(!v)return "-";const d=new Date(v);return Number.isNaN(d.getTime())?"-":d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})};

function TransactionHistory(){
 const settings=useAppSettings();
 const [income,setIncome]=useState([]),[expense,setExpense]=useState([]),[banks,setBanks]=useState([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false);
 const [query,setQuery]=useState(""),[type,setType]=useState("all"),[dateFilter,setDateFilter]=useState("all"),[page,setPage]=useState(1); const pageSize=12;
 const load=async(show=false)=>{if(show)setRefreshing(true);try{const [i,e,b]=await Promise.all([getIncome(),getExpense(),getBankAccounts()]);setIncome(safe(i));setExpense(safe(e));setBanks(safe(b));}catch(e){console.error(e)}finally{setLoading(false);setRefreshing(false)}};
 useEffect(()=>{load();const r=()=>load(true);window.addEventListener("bb:data-changed",r);return()=>window.removeEventListener("bb:data-changed",r)},[]);
 const bankName=(id)=>banks.find(b=>String(b.id)===String(id))?.bank_name||banks.find(b=>String(b.id)===String(id))?.name||"Unlinked";
 const payMethodLabel=(x)=>{const m=x.payment_method||"Bank";return m==="Bank"?bankName(x.bank_account_id):m;};
 const rows=useMemo(()=>[...income.map(x=>({...x,kind:"Income",date:x.transaction_date||x.created_at})),...expense.map(x=>({...x,kind:"Expense",date:x.transaction_date||x.created_at}))].sort((a,b)=>new Date(b.date)-new Date(a.date)),[income,expense]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();const now=Date.now();return rows.filter(x=>{if(type!=="all"&&x.kind!==type)return false;if(dateFilter!=="all"){const d=new Date(x.date).getTime();if(!Number.isFinite(d)||now-d>Number(dateFilter)*86400000)return false}if(!q)return true;return [x.category,x.description,x.source,bankName(x.bank_account_id)].some(v=>String(v??"").toLowerCase().includes(q))})},[rows,type,dateFilter,query,banks]);
 useEffect(()=>setPage(1),[query,type,dateFilter]);
 const totalIncome=income.reduce((s,x)=>s+num(x.amount),0),totalExpense=expense.reduce((s,x)=>s+num(x.amount),0),pages=Math.max(1,Math.ceil(filtered.length/pageSize));const visible=filtered.slice((page-1)*pageSize,page*pageSize);
 if(loading)return <LoadingSpinner/>;
 return <><Sidebar/><Navbar/><main className="transactions-page"><div className="transactions-container">
  <header className="transactions-hero"><div><span>LEDGER • TRANSACTION CENTER</span><h1>Transaction History</h1><p>A clean, audit-friendly view of every income and expense record.</p><small>Last refreshed {formatDateTime(new Date(),settings.dateFormat)}</small></div><button onClick={()=>load(true)} disabled={refreshing}><FaSyncAlt className={refreshing?"tx-spin":""}/> {refreshing?"Refreshing":"Refresh"}</button></header>
  <section className="transaction-kpis"><div className="tx-kpi income"><FaArrowUp/><span>INCOME</span><strong>{formatMoney(totalIncome,settings.currency)}</strong></div><div className="tx-kpi expense"><FaArrowDown/><span>EXPENSE</span><strong>{formatMoney(totalExpense,settings.currency)}</strong></div><div className="tx-kpi balance"><FaReceipt/><span>NET</span><strong>{formatMoney(totalIncome-totalExpense,settings.currency)}</strong></div><div className="tx-kpi records"><FaCalendarAlt/><span>RECORDS</span><strong>{filtered.length}</strong></div></section>
  <section className="transaction-toolbar"><div className="tx-search"><FaSearch/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search category, description, source or bank…"/></div><div className="tx-filter"><FaFilter/><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option><option value="Income">Income</option><option value="Expense">Expense</option></select></div><div className="tx-filter"><FaCalendarAlt/><select value={dateFilter} onChange={e=>setDateFilter(e.target.value)}><option value="all">All dates</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></div></section>
  <section className="transaction-table-card"><div className="transaction-table-head"><div><span>FINANCIAL LEDGER</span><h2>{filtered.length} matching transaction{filtered.length===1?"":"s"}</h2></div><span className="currency-chip">{settings.currency} • {settings.dateFormat}</span></div>{visible.length?<div className="transaction-table-wrap"><table><thead><tr><th>Transaction</th><th>Payment Method</th><th>Date & Time</th><th>Status</th><th className="amount-col">Amount</th></tr></thead><tbody>{visible.map(x=>{const incomeRow=x.kind==="Income";return <tr key={`${x.kind}-${x.id}`}><td><div className="tx-main"><span className={`tx-icon ${incomeRow?"income":"expense"}`}>{incomeRow?<FaArrowUp/>:<FaArrowDown/>}</span><div><strong>{x.category||"Other"}</strong><small>{x.description||x.source||"No description"}</small></div></div></td><td>{payMethodLabel(x)}</td><td><strong>{dateText(x.date,settings.dateFormat)}</strong><small>{timeText(x.date)}</small></td><td><span className="completed">Completed</span></td><td className={`tx-amount ${incomeRow?"positive":"negative"}`}>{incomeRow?"+":"-"}{formatMoney(x.amount,settings.currency)}</td></tr>})}</tbody></table></div>:<div className="tx-empty"><FaReceipt/><h3>No transactions found</h3><p>Try changing the search or filters.</p></div>}
   {pages>1&&<div className="tx-pagination"><button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><span>Page <b>{page}</b> of <b>{pages}</b></span><button disabled={page===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</button></div>}
  </section><Footer/></div></main></>;
}
export default TransactionHistory;
