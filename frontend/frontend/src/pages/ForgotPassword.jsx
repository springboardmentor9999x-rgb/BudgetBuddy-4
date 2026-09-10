import { useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "../utils/notifications";

import { forgotPassword } from "../services/authService";
import { validateEmail } from "../utils/validators";

import "../styles/login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const result = await forgotPassword(email);
      setSent(true);
      toast.success(result.message);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ToastContainer />
      <div className="login-card">
        <h2>BudgetBuddy</h2>
        <p>Reset your password</p>

        {sent ? (
          <p className="text-success mt-3">
            If an account with that email exists, a password reset link has
            been sent. Please check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-3">
          <Link to="/">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
