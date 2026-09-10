import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "../utils/notifications";
import { getCurrentUser } from "../services/authService";
import { getProfile, createProfile, updateProfile } from "../services/profileService";
import { requestPremium, getMyPremiumRequest } from "../services/premiumRequestService";
import { useAppSettings } from "../utils/useAppSettings";
import { getCurrencyMeta, saveAppSettings } from "../utils/settings";
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaWallet, FaGlobe, FaCrown, FaCheckCircle } from "react-icons/fa";
import "../styles/profile.css";

function Profile() {
    const appSettings = useAppSettings();
    const [user, setUser] = useState(getCurrentUser());
    const [exists, setExists] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        monthly_income: 0,
        currency: appSettings?.currency || "INR",
        phone_number: "",
    });
    const [premiumRequest, setPremiumRequest] = useState(null);
    const [requesting, setRequesting] = useState(false);

    const currency = profile.currency || appSettings?.currency || "INR";
    const currencyMeta = getCurrencyMeta(currency);

    useEffect(() => {
        (async () => {
            try {
                const data = await getProfile();
                setExists(true);
                setProfile((previous) => ({
                    ...previous,
                    ...data,
                    phone_number: user?.phone_number || "",
                }));
            } catch {
                setProfile((previous) => ({
                    ...previous,
                    full_name: user?.full_name || "",
                    phone_number: user?.phone_number || "",
                }));
            }
        })();
    }, []);

    useEffect(() => {
        if (user?.role === "admin" || user?.account_tier === "premium") return;

        (async () => {
            try {
                setPremiumRequest(await getMyPremiumRequest());
            } catch {
                setPremiumRequest(null);
            }
        })();
    }, [user]);

    const isAdmin = user?.role === "admin";
    const isPremium = !isAdmin && user?.account_tier === "premium";
    const initials = useMemo(
        () =>
            String(profile.full_name || user?.email || "U")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "U",
        [profile.full_name, user?.email]
    );

    const accountLabel = isAdmin
        ? "Administrator"
        : isPremium
            ? "Premium member"
            : "Normal member";

    const submitPremiumRequest = async () => {
        setRequesting(true);
        try {
            const req = await requestPremium();
            setPremiumRequest(req);
            toast.success("Premium request sent to the Admin for review.");
        } catch (error) {
            toast.error(
                error?.response?.data?.detail ||
                "Unable to submit Premium request."
            );
        } finally {
            setRequesting(false);
        }
    };

    const save = async (e) => {
        e.preventDefault();

        if (!profile.full_name.trim()) {
            toast.error("Name is required.");
            return;
        }

        if (Number(profile.monthly_income) < 0) {
            toast.error("Monthly income cannot be negative.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                full_name: profile.full_name.trim(),
                monthly_income: Number(profile.monthly_income || 0),
                currency,
                phone_number: profile.phone_number?.trim() || null,
            };

            const result = exists
                ? await updateProfile(payload)
                : await createProfile(payload);

            setExists(true);

            const nextUser = {
                ...user,
                full_name: payload.full_name,
                phone_number: payload.phone_number,
            };

            localStorage.setItem("user", JSON.stringify(nextUser));
            setUser(nextUser);
            setProfile((previous) => ({
                ...previous,
                ...result,
                phone_number: payload.phone_number,
            }));

            saveAppSettings({
                ...appSettings,
                currency: payload.currency,
            });

            toast.success("Profile saved successfully.");
        } catch (error) {
            toast.error(
                error?.response?.data?.detail ||
                "Unable to save profile."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Sidebar />
            <Navbar />
            <ToastContainer />

            <main className="profile-page">
                <div className="profile-container">
                    <section className="profile-hero">
                        <div className="profile-hero-identity">
                            <div className="profile-avatar" aria-hidden="true">
                                {initials}
                            </div>

                            <div className="profile-hero-copy">
                                <span className="profile-eyebrow">ACCOUNT CENTER</span>
                                <h1>{profile.full_name || "Your Profile"}</h1>
                                <p>
                                    {user?.email || "Signed-in account"} · {accountLabel}
                                </p>
                            </div>
                        </div>

                        <div className={`profile-status-pill ${isAdmin ? "admin" : isPremium ? "premium" : "normal"}`}>
                            {isAdmin ? <FaShieldAlt /> : isPremium ? <FaCrown /> : <FaUser />}
                            {isAdmin ? "ADMIN" : isPremium ? "PREMIUM" : "NORMAL"}
                        </div>
                    </section>

                    <section className="profile-overview-grid">
                        <article className="profile-overview-card">
                            <span className="profile-overview-icon"><FaEnvelope /></span>
                            <div>
                                <small>EMAIL</small>
                                <strong>{user?.email || "Not available"}</strong>
                            </div>
                        </article>

                        <article className="profile-overview-card">
                            <span className="profile-overview-icon"><FaPhone /></span>
                            <div>
                                <small>PHONE</small>
                                <strong>{profile.phone_number || "Not added"}</strong>
                            </div>
                        </article>

                        <article className="profile-overview-card">
                            <span className="profile-overview-icon"><FaGlobe /></span>
                            <div>
                                <small>CURRENCY</small>
                                <strong>{currencyMeta.symbol} {currency}</strong>
                            </div>
                        </article>

                        <article className="profile-overview-card">
                            <span className="profile-overview-icon"><FaCheckCircle /></span>
                            <div>
                                <small>ACCOUNT STATUS</small>
                                <strong className="profile-active">Active</strong>
                            </div>
                        </article>
                    </section>

                    <section className="profile-card profile-details-card">
                        <div className="profile-section-heading">
                            <div className="profile-section-icon"><FaUser /></div>
                            <div>
                                <span>PERSONAL INFORMATION</span>
                                <h2>Profile details</h2>
                                <p>Keep your account information accurate and up to date.</p>
                            </div>
                        </div>

                        <div className="profile-divider" />

                        <form onSubmit={save} className="profile-form">
                            <div className="profile-field">
                                <label htmlFor="profile-name">Full Name</label>
                                <input
                                    id="profile-name"
                                    className="form-control"
                                    value={profile.full_name}
                                    onChange={(e) =>
                                        setProfile({ ...profile, full_name: e.target.value })
                                    }
                                    autoComplete="name"
                                />
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-phone">Phone Number</label>
                                <input
                                    id="profile-phone"
                                    className="form-control"
                                    type="tel"
                                    placeholder="+91XXXXXXXXXX"
                                    value={profile.phone_number || ""}
                                    onChange={(e) =>
                                        setProfile({ ...profile, phone_number: e.target.value })
                                    }
                                    autoComplete="tel"
                                />
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-email">Email</label>
                                <input
                                    id="profile-email"
                                    className="form-control"
                                    value={user?.email || ""}
                                    readOnly
                                />
                                <small>Email is managed by your authenticated account.</small>
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-role">Account Role</label>
                                <input
                                    id="profile-role"
                                    className="form-control"
                                    value={isAdmin ? "Administrator" : "Customer"}
                                    readOnly
                                />
                                <small>{isAdmin ? "Administrative access" : "Personal finance workspace"}</small>
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-income">Monthly Income</label>
                                <div className="profile-money-input">
                                    <span>{currencyMeta.symbol}</span>
                                    <input
                                        id="profile-income"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-control"
                                        value={profile.monthly_income}
                                        onChange={(e) =>
                                            setProfile({ ...profile, monthly_income: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profile-currency">Preferred Currency</label>
                                <select
                                    id="profile-currency"
                                    className="form-select"
                                    value={currency}
                                    onChange={(e) =>
                                        setProfile({ ...profile, currency: e.target.value })
                                    }
                                >
                                    <option value="INR">₹ INR — Indian Rupee</option>
                                    <option value="USD">$ USD — US Dollar</option>
                                    <option value="EUR">€ EUR — Euro</option>
                                    <option value="GBP">£ GBP — British Pound</option>
                                </select>
                                <small>Used for financial values displayed across BudgetBuddy.</small>
                            </div>

                            <div className="profile-form-actions">
                                <button className="btn btn-primary profile-save-btn" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="profile-card profile-subscription-card">
                        <div className="profile-section-heading">
                            <div className="profile-section-icon"><FaWallet /></div>
                            <div>
                                <span>PLAN & ACCESS</span>
                                <h2>Subscription</h2>
                                <p>Your current BudgetBuddy access level.</p>
                            </div>
                        </div>

                        <div className="profile-divider" />

                        <div className={`profile-plan-panel ${isAdmin ? "admin" : isPremium ? "premium" : "normal"}`}>
                            <div>
                                <strong>{isAdmin ? "Administrator access" : isPremium ? "Premium access active" : "Normal plan"}</strong>
                                <p>
                                    {isAdmin
                                        ? "Administrative access is separate from customer subscription tiers."
                                        : isPremium
                                            ? "Advanced financial intelligence is unlocked for this account."
                                            : "Your account is on the Normal plan. Premium access can be requested for Admin review."}
                                </p>
                            </div>

                            {!isAdmin && !isPremium && (
                                <div className="profile-premium-actions">
                                    {premiumRequest?.status === "pending" && (
                                        <div className="alert alert-warning">
                                            🕒 Your Premium request is pending Admin review.
                                        </div>
                                    )}

                                    {premiumRequest?.status === "rejected" && (
                                        <div className="alert alert-secondary">
                                            Your last Premium request was not approved. You can request again.
                                        </div>
                                    )}

                                    {premiumRequest?.status !== "pending" && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-success"
                                            disabled={requesting}
                                            onClick={submitPremiumRequest}
                                        >
                                            {requesting ? "Sending..." : "🔒 Request Premium"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <Footer />
                </div>
            </main>
        </>
    );
}

export default Profile;
