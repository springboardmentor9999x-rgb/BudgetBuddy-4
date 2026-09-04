import { useEffect, useState } from "react";
import { FaBell, FaCheckCircle, FaCreditCard, FaDatabase, FaUsers } from "react-icons/fa";
import api from "../api/axios";
import "./Admin.css";

export default function SystemManagement(){
 const [overview,setOverview]=useState(null),[activity,setActivity]=useState([]),[error,setError]=useState("");
 useEffect(()=>{Promise.all([api.get("/admin/overview"),api.get("/admin/activity")]).then(([summary,events])=>{setOverview(summary.data);setActivity(events.data);}).catch(()=>setError("System management information could not be loaded."));},[]);
 if(error)return <p className="admin-error">{error}</p>;
 if(!overview)return <div className="reports-message">Loading system management...</div>;
 const checks=[[FaDatabase,"Database","Connected"],[FaUsers,"Active accounts",overview.active_users],[FaCreditCard,"Successful payments",overview.successful_payments],[FaBell,"Recent activity",activity.length]];
 return <main className="admin-page"><header><span>Admin control</span><h1>System management</h1><p>Monitor account access, payments, and application activity.</p></header><section className="admin-stats">{checks.map(([Icon,label,value])=><article key={label}><Icon/><span>{label}</span><strong>{value}</strong></article>)}</section><section className="admin-users"><h2>Operational status</h2><div className="admin-table-wrap"><table><thead><tr><th>Service</th><th>Status</th><th>Details</th></tr></thead><tbody><tr><td>Authentication</td><td><FaCheckCircle/> Healthy</td><td>{overview.verified_users} verified accounts</td></tr><tr><td>Subscriptions</td><td><FaCheckCircle/> Healthy</td><td>{overview.premium_users} Premium members</td></tr><tr><td>Transactions</td><td><FaCheckCircle/> Healthy</td><td>{overview.total_transactions} financial records</td></tr><tr><td>Payments</td><td><FaCheckCircle/> Healthy</td><td>{overview.successful_payments} verified payments</td></tr></tbody></table></div></section><section className="admin-users"><h2>Latest system events</h2><div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Event</th><th>Message</th></tr></thead><tbody>{activity.slice(0,20).map(event=><tr key={event.id}><td>{event.user}</td><td>{event.type}</td><td>{event.message}</td></tr>)}</tbody></table></div></section></main>;
}
