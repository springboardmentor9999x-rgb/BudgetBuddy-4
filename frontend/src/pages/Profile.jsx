import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaShieldAlt, FaUser } from "react-icons/fa";
import { getProfile, updateProfile } from "../services/profileService";
import "./Profile.css";

const emptyProfile = { full_name: "", email: "", phone: "", address: "" };

function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getProfile().then(setProfile).catch(() => setNotice({ type: "error", message: "Could not load your profile." })); }, []);
  const completion = useMemo(() => Math.round(([profile.full_name, profile.email, profile.phone, profile.address].filter(Boolean).length / 4) * 100), [profile]);
  const update = (key, value) => { setNotice(null); setProfile((current) => ({ ...current, [key]: value })); };
  const save = async (event) => { event.preventDefault(); setSaving(true); try { const saved = await updateProfile(profile); setProfile(saved); setNotice({ type: "success", message: "Profile saved successfully." }); window.dispatchEvent(new Event("budgetbuddy:profile-updated")); } catch (error) { setNotice({ type: "error", message: error.response?.data?.detail || "Could not save your profile." }); } finally { setSaving(false); } };
  const initial = profile.full_name.trim().charAt(0).toUpperCase() || "V";

  return <div className="profile-page">
    <header className="profile-heading"><div className="profile-avatar"><span>{initial}</span><i><FaCheckCircle /></i></div><div className="profile-heading-copy"><p>Personal workspace</p><h1>{profile.full_name || "My profile"}</h1><span>Keep your details current so BudgetBuddy feels tailored to you.</span><div className="profile-status"><span className="status-pill"><FaShieldAlt /> Verified identity</span><small>Your financial identity is protected.</small></div></div><div className="profile-completion"><span>Profile completeness</span><strong>{completion}%</strong><i><em style={{ width: `${completion}%` }} /></i></div></header>
    {notice && <div className={`profile-notice ${notice.type || "success"}`} role="status"><FaCheckCircle /> {notice.message}</div>}
    <div className="profile-grid"><form className="profile-card profile-form" onSubmit={save}><div className="profile-card-head"><div><p>About you</p><h2><FaUser /> Personal details</h2></div><span>Visible only to you</span></div><label>Full name<input required value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your full name" /></label><label className="profile-email-field">Verified email <span><FaLock /> Fixed to your sign-in identity</span><input type="email" value={profile.email} readOnly aria-readonly="true" title="This is your verified sign-in email and cannot be changed here." /></label><label>Phone number<input value={profile.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" /></label><label className="profile-full">Address<textarea rows="3" value={profile.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="City, State" /></label><div className="profile-form-footer"><small>Your verified sign-in email is protected and can’t be changed here.</small><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form><aside className="profile-card profile-contact"><div className="profile-card-head"><div><p>Quick view</p><h2>Identity & contact</h2></div><span className="profile-live">Verified</span></div><div className="profile-contact-list"><p><FaEnvelope /><span><small>Verified email</small>{profile.email || "Email not added"}</span></p><p><FaPhone /><span><small>Phone</small>{profile.phone || "Phone not added"}</span></p><p><FaMapMarkerAlt /><span><small>Location</small>{profile.address || "Address not added"}</span></p></div><div className="profile-security"><FaShieldAlt /><div><strong>Your details stay private</strong><span>BudgetBuddy never exposes these details in your financial activity.</span></div></div></aside></div>
  </div>;
}

export default Profile;
