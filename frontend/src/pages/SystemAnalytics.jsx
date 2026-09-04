import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import "./Admin.css";
import "./Reports.css";

const money=(value)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value||0);
export default function SystemAnalytics(){
 const [data,setData]=useState(null),[error,setError]=useState("");
 useEffect(()=>{api.get("/admin/system-analytics").then(response=>setData(response.data)).catch(()=>setError("System analytics could not be loaded."));},[]);
 if(error)return <p className="admin-error">{error}</p>;
 if(!data)return <p className="reports-message">Loading system analytics...</p>;
 return <main className="admin-page"><header><span>Administration</span><h1>System analytics</h1><p>Aggregated application activity across all users.</p></header><section className="admin-stats"><article><span>Total income</span><strong>{money(data.total_income)}</strong></article><article><span>Total expenses</span><strong>{money(data.total_expenses)}</strong></article><article><span>System net</span><strong>{money(data.net)}</strong></article></section><section className="admin-users report-chart"><h2>Spending across all users</h2><ResponsiveContainer width="100%" height={350}><BarChart data={data.categories}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="category"/><YAxis/><Tooltip formatter={money}/><Bar dataKey="total" fill="#6c4df6" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></section></main>;
}
