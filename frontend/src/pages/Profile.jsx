import { useEffect, useState } from "react";
import { FaCheckCircle, FaEnvelope, FaMapMarkerAlt, FaPhone, FaUser } from "react-icons/fa";
import "./Profile.css";

const defaults = { fullName: "Varshini", email: "", phone: "", address: "", occupation: "" };

function Profile() {
  const [profile, setProfile] = useState(defaults);
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { setProfile({ ...defaults, ...JSON.parse(localStorage.getItem("budgetbuddy-profile") || "{}") }); } catch { localStorage.removeItem("budgetbuddy-profile"); } }, []);
  const save = (event) => { event.preventDefault(); localStorage.setItem("budgetbuddy-profile", JSON.stringify(profile)); setSaved(true); };
  const update = (key, value) => { setSaved(false); setProfile({ ...profile, [key]: value }); };
  const initial = profile.fullName.trim().charAt(0).toUpperCase() || "V";
  return <div className="profile-page"><header className="profile-heading"><div className="profile-avatar">{initial}</div><div><p>Personal account</p><h1>My profile</h1><span>Manage the details shown in your BudgetBuddy account.</span></div></header>{saved && <div className="profile-notice"><FaCheckCircle /> Profile saved successfully.</div>}<div className="profile-grid"><form className="profile-card profile-form" onSubmit={save}><h2><FaUser /> Personal details</h2><label>Full name<input required value={profile.fullName} onChange={(e) => update("fullName", e.target.value)} /></label><label>Email address<input type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></label><label>Phone number<input value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" /></label><label>Occupation<input value={profile.occupation} onChange={(e) => update("occupation", e.target.value)} placeholder="Your occupation" /></label><label className="profile-full">Address<textarea rows="3" value={profile.address} onChange={(e) => update("address", e.target.value)} placeholder="City, State" /></label><button type="submit">Save profile</button></form><aside className="profile-card profile-contact"><h2>Contact overview</h2><p><FaEnvelope /> {profile.email || "Email not added"}</p><p><FaPhone /> {profile.phone || "Phone not added"}</p><p><FaMapMarkerAlt /> {profile.address || "Address not added"}</p><small>These display details are saved locally in this browser.</small></aside></div></div>;
}
export default Profile;
