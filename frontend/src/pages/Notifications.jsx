import { useEffect, useMemo, useState } from "react";
import { FaBell, FaCheck, FaEnvelope, FaEnvelopeOpen, FaFilter } from "react-icons/fa";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import "./Notifications.css";

const titles={budget_alert:"Budget alert",goal_milestone:"Goal milestone",monthly_report:"Monthly report",income_added:"Income added",expense_added:"Expense added",income_updated:"Income updated",expense_updated:"Expense updated"};
const titleFor=item=>titles[item.type]||item.type?.split("_").map(word=>word[0]?.toUpperCase()+word.slice(1)).join(" ")||"Account update";
const when=value=>value?new Date(value).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}):"Recently";

export default function Notifications(){
 const [items,setItems]=useState([]),[filter,setFilter]=useState("all"),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{getNotifications().then(setItems).catch(()=>setError("We could not load your notifications.")).finally(()=>setLoading(false));},[]);
 const unread=items.filter(item=>!item.is_read).length;
 const visible=useMemo(()=>items.filter(item=>filter==="all"||(filter==="unread"?!item.is_read:item.is_read)),[items,filter]);
 const markRead=async item=>{if(item.is_read)return;try{const updated=await markNotificationRead(item.id);setItems(current=>current.map(entry=>entry.id===item.id?updated:entry));}catch{setError("That notification could not be updated.");}};
 const markAll=async()=>{const pending=items.filter(item=>!item.is_read);try{const updated=await Promise.all(pending.map(item=>markNotificationRead(item.id)));const ids=new Set(updated.map(item=>item.id));setItems(current=>current.map(item=>ids.has(item.id)?{...item,is_read:true}:item));}catch{setError("Some notifications could not be updated.");}};
 return <main className="notifications-page">
  <header className="notifications-hero"><div><span><FaBell/> Notification center</span><h1>Your messages</h1><p>Keep track of account activity, budget alerts, goals, and reports.</p></div><div className="notifications-summary"><strong>{unread}</strong><span>unread message{unread===1?"":"s"}</span></div></header>
  <section className="notifications-toolbar"><div className="notification-filters" aria-label="Filter notifications"><FaFilter/>{[["all","All messages"],["unread","Unread"],["read","Read"]].map(([value,label])=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{label}{value==="unread"&&unread>0?<b>{unread}</b>:null}</button>)}</div><button className="mark-all" onClick={markAll} disabled={!unread}><FaCheck/> Mark all as read</button></section>
  {error&&<p className="notifications-error">{error}</p>}
  <section className="notifications-panel">{loading?<p className="notifications-state">Loading messages…</p>:visible.length?visible.map(item=><button key={item.id} className={`notification-row ${item.is_read?"read":"unread"}`} onClick={()=>markRead(item)}><span className="notification-row-icon">{item.is_read?<FaEnvelopeOpen/>:<FaEnvelope/>}</span><span className="notification-row-copy"><span><strong>{titleFor(item)}</strong>{!item.is_read&&<em>New</em>}</span><p>{item.message}</p><small>{when(item.created_at)}</small></span><span className="notification-row-action">{item.is_read?"Read":"Mark read"}</span></button>):<div className="notifications-state"><FaBell/><strong>No {filter==="all"?"":filter} messages</strong><span>{filter==="unread"?"You're all caught up.":"Notifications will appear here when there is activity."}</span></div>}</section>
 </main>;
}
