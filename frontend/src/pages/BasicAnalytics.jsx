import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import "./Analytics.css";
import "./Reports.css";
import { useMonth } from "../context/MonthContext";

const colors=["#6c4df6","#0f9f6e","#ec9a21","#df3f4f","#3182f6"];
const money=(value)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value||0);
export default function BasicAnalytics(){
 const {selectedMonth}=useMonth();
 const [data,setData]=useState(null),[error,setError]=useState("");
 useEffect(()=>{setData(null);setError("");Promise.all([api.get("/analytics/summary",{params:{month:selectedMonth}}),api.get("/analytics/spending-by-category",{params:{month:selectedMonth}}),api.get("/analytics/savings-progress")]).then(([summary,categories,goals])=>setData({summary:summary.data,categories:categories.data,goals:goals.data})).catch(()=>setError("Analytics could not be loaded."));},[selectedMonth]);
 if(error)return <p className="reports-message error">{error}</p>;
 if(!data)return <p className="reports-message">Loading this month's analytics...</p>;
 return <main className="reports-page analytics-page"><header className="statement-toolbar"><div><p>Current month</p><h1>Basic analytics</h1><span>A simple view of where your money went this month.</span></div></header><section className="reports-stat-grid"><article className="report-stat income"><span>Income</span><strong>{money(data.summary.total_income)}</strong></article><article className="report-stat expense"><span>Expenses</span><strong>{money(data.summary.total_expenses)}</strong></article><article className="report-stat"><span>Net balance</span><strong>{money(data.summary.net_balance)}</strong></article></section><section className="reports-main-grid"><article className="report-chart"><h2>Spending by category</h2>{data.categories.length?<ResponsiveContainer width="100%" height={310}><PieChart><Pie data={data.categories} dataKey="total" nameKey="category" outerRadius={100}>{data.categories.map((item,index)=><Cell key={item.category} fill={colors[index%colors.length]}/>)}</Pie><Tooltip formatter={money}/></PieChart></ResponsiveContainer>:<p className="reports-empty">No expenses this month.</p>}</article><article className="report-chart"><h2>Income vs expense</h2><ResponsiveContainer width="100%" height={310}><BarChart data={[{name:"This month",income:data.summary.total_income,expenses:data.summary.total_expenses}]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={money}/><Bar dataKey="income" fill="#0f9f6e"/><Bar dataKey="expenses" fill="#df3f4f"/></BarChart></ResponsiveContainer></article></section><section className="goal-report analytics-lower"><h2>Savings goal progress</h2>{data.goals.length?data.goals.map(goal=><div className="goal-report-item" key={goal.id}><div><strong>{goal.goal_name}</strong><span>{goal.progress_percentage}% complete</span></div><div className="goal-report-track"><span style={{width:`${goal.progress_percentage}%`}}/></div></div>):<p className="reports-empty">No active goals.</p>}</section></main>;
}
