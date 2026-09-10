import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "../utils/notifications";

import { resetPassword } from "../services/authService";
import { validatePassword } from "../utils/validators";
import PasswordStrength from "../components/PasswordStrength";

import "../styles/login.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      toast.error(
        "Password must be 8+ characters with uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const result = await resetPassword(token, newPassword, confirmPassword);
      toast.success(result.message);
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "This reset link is invalid or has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ToastContainer />
      <div className="login-card">
        <h2>BudgetBuddy</h2>
        <p>Set a new password</p>

        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {newPassword && <PasswordStrength password={newPassword} />}

          <label className="mt-3">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button className="btn btn-primary w-100 mt-4" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-3">
          <Link to="/">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
