import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import "./Analytics.css";
import "./Reports.css";
import { useMonth } from "../context/MonthContext";

const money=(value)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value||0);
export default function AdvancedAnalytics(){
 const {selectedMonth}=useMonth();
 const bounds=(month)=>{const [year,value]=month.split("-").map(Number);return {start_date:`${month}-01`,end_date:new Date(year,value,0).toISOString().slice(0,10)}};
 const [range,setRange]=useState(()=>bounds(selectedMonth)),[data,setData]=useState(null),[error,setError]=useState("");
 const {start_date,end_date}=range;
 useEffect(()=>setRange(bounds(selectedMonth)),[selectedMonth]);
 useEffect(()=>{setData(null);api.get("/premium/insights",{params:{start_date,end_date}}).then(response=>setData(response.data)).catch(()=>setError("Premium insights could not be loaded."));},[start_date,end_date]);
 if(error)return <p className="reports-message error">{error}</p>;
 if(!data)return <p className="reports-message">Loading Premium insights...</p>;
 return <main className="reports-page analytics-page"><header className="statement-toolbar"><div><p>Premium insights</p><h1>Advanced analytics</h1><span>Yearly trends, comparisons, and custom-range analysis.</span></div><div className="reports-actions"><label>From<input type="date" value={range.start_date} onChange={event=>setRange(current=>({...current,start_date:event.target.value}))}/></label><label>To<input type="date" value={range.end_date} onChange={event=>setRange(current=>({...current,end_date:event.target.value}))}/></label></div></header><section className="reports-stat-grid"><article className="report-stat expense"><span>Expense change vs last month</span><strong>{data.comparison.expense_change_percent}%</strong></article><article className="report-stat income"><span>Selected-range income</span><strong>{money(data.summary.total_income)}</strong></article><article className="report-stat"><span>Selected-range net</span><strong>{money(data.summary.net_balance)}</strong></article></section><section className="reports-main-grid"><article className="report-chart"><h2>12-month cash flow</h2><ResponsiveContainer width="100%" height={330}><LineChart data={data.yearly_trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={money}/><Legend/><Line dataKey="income" stroke="#0f9f6e" strokeWidth={3}/><Line dataKey="expenses" stroke="#df3f4f" strokeWidth={3}/></LineChart></ResponsiveContainer></article><article className="report-chart"><h2>Category analysis</h2><ResponsiveContainer width="100%" height={330}><BarChart data={data.categories}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="category"/><YAxis/><Tooltip formatter={money}/><Bar dataKey="total" fill="#6c4df6" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></article></section></main>;
}
