import { useEffect, useState } from "react";
import { FaCheck, FaCrown, FaFileExport, FaHeadset, FaPalette } from "react-icons/fa";
import { activateDemoPremium, activatePremium, cancelMembership, createPaymentOrder, getMembership, verifyPayment } from "../services/adminService";
import "./Premium.css";

const benefits = [
  [FaFileExport, "Advanced exports", "Create polished PDF and Excel financial reports."],
  [FaPalette, "Premium insights", "Get richer analytics and category visualizations."],
  [FaHeadset, "Priority support", "Move to the front of the support queue."],
];

export default function Premium() {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getMembership()
      .then(setMembership)
      .catch(() => setNotice("Could not load membership details. The Premium options are still available below."))
      .finally(() => setLoading(false));
  }, []);

  const premium = membership?.is_premium === true;
  const loadCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Checkout could not be loaded"));
    document.body.appendChild(script);
  });
  const changePlan = async () => {
    setSaving(true);
    setNotice("");
    try {
      if (premium) {
        setMembership(await cancelMembership());
        setNotice("Your Premium membership has been cancelled.");
        window.dispatchEvent(new Event("budgetbuddy:membership-updated"));
        return;
      }
      try {
        await activatePremium();
        setMembership(await getMembership());
        setNotice("Welcome to BudgetBuddy Premium!");
        window.dispatchEvent(new Event("budgetbuddy:membership-updated"));
        return;
      } catch (upgradeError) {
        if (upgradeError.response?.status !== 402) throw upgradeError;
      }
      const order = await createPaymentOrder();
      await loadCheckout();
      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.key_id, amount: order.amount, currency: order.currency, name: "BudgetBuddy",
          description: order.name, order_id: order.order_id,
          handler: async (response) => {
            try { await verifyPayment(response); resolve(); } catch (error) { reject(error); }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          theme: { color: "#6c4df6" },
        });
        checkout.on("payment.failed", () => reject(new Error("Payment failed")));
        checkout.open();
      });
      setMembership(await getMembership());
      setNotice("Payment verified. Welcome to BudgetBuddy Premium!");
      window.dispatchEvent(new Event("budgetbuddy:membership-updated"));
    } catch (error) {
      if (error.response?.status === 503) {
        try {
          await activateDemoPremium();
          setMembership(await getMembership());
          setNotice("Development demo upgrade completed. Premium is now active.");
          window.dispatchEvent(new Event("budgetbuddy:membership-updated"));
          return;
        } catch (demoError) {
          setNotice(demoError.response?.status === 404
            ? "Razorpay is not configured. For a local demo, set APP_ENV=development and DEMO_PAYMENTS_ENABLED=true in backend/.env, then restart the backend."
            : demoError.response?.data?.detail || "Development upgrade could not be completed.");
          return;
        }
      }
      setNotice(error.response?.data?.detail || error.message || "Payment could not be completed.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="premium-page" aria-busy={loading}>
    <header className="premium-hero">
      <span><FaCrown /> BudgetBuddy Premium</span>
      <h1>{premium ? "You're a Premium member" : "Make your money work smarter"}</h1>
      <p>Unlock the complete planning and analytics experience.</p>
      <b>{loading ? "CHECKING MEMBERSHIP" : premium ? "ACTIVE MEMBERSHIP" : "FREE PLAN"}</b>
    </header>
    {notice && <p className="premium-notice" role="status">{notice}</p>}
    <section className="premium-card">
      <div className="premium-price">
        <span>Premium plan</span>
        <strong><span aria-label="Indian rupees">&#8377;</span>299<small>/month</small></strong>
        <p>One simple plan. Cancel whenever you want.</p>
        <button type="button" disabled={loading || saving} onClick={changePlan}>{saving ? "Processing..." : premium ? "Cancel Premium" : "Activate Premium"}</button>
      </div>
      <div className="premium-benefits">
        {benefits.map(([Icon, title, copy]) => <article key={title}><i><Icon /></i><div><strong>{title}</strong><p>{copy}</p></div><FaCheck /></article>)}
      </div>
    </section>
    <small className="premium-demo-note">Premium access is activated securely by the BudgetBuddy backend. Payment support is ready for future use.</small>
  </main>;
}
