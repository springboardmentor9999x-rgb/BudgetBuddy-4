import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email || (codeRequested && (!code || !newPassword || !confirmPassword))) {
      setError("Please fill in all fields.");
      return;
    }

    if (!codeRequested) {
      try {
        setLoading(true);
        const response = await api.post("/auth/forgot-password", { email: email.trim() });
        setMessage(response.data.message);
        setCodeRequested(true);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to request a reset code. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/reset-password",
        {
          email: email.trim(),
          code: code.trim().toUpperCase(),
          new_password: newPassword,
        }
      );

      setMessage(response.data.message);

      // Remove old login token if one exists
      localStorage.removeItem("token");

      // Redirect to login after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">

      <div className="forgot-container">

        {/* LEFT SIDE */}
        <section className="forgot-left">

          <div className="forgot-brand">
            <div className="forgot-brand-icon">₹</div>
            <span>BudgetBuddy</span>
          </div>

          <div className="forgot-welcome">

            <p>Hello!</p>

            <h1>
              Don't
              <br />
              <strong>WORRY</strong>
            </h1>

            <p className="forgot-description">
              Reset your password and get back to
              managing your money smarter.
            </p>

          </div>

          <div className="forgot-decoration forgot-decoration-one"></div>
          <div className="forgot-decoration forgot-decoration-two"></div>

        </section>


        {/* RIGHT SIDE */}
        <section className="forgot-right">

          <div className="forgot-form-container">

            <h2>Forgot Password?</h2>

            <p className="forgot-subtitle">
              {codeRequested ? "Enter the code sent to your email and choose a new password." : "Enter your registered email to receive a password reset code."}
            </p>

            <form onSubmit={handleResetPassword}>

              {/* EMAIL */}

              <div className="forgot-form-group">

                <label htmlFor="reset-email">
                  Email Address
                </label>

                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                />

              </div>

              {codeRequested && <>
                <div className="forgot-form-group">
                  <label htmlFor="reset-code">Verification code</label>
                  <input id="reset-code" type="text" placeholder="Enter 6-character code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength="6" autoComplete="one-time-code" />
                </div>


              {/* NEW PASSWORD */}

              <div className="forgot-form-group">

                <label htmlFor="new-password">
                  New Password
                </label>

                <div className="forgot-password-container">

                  <input
                    id="new-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="forgot-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>


              {/* CONFIRM PASSWORD */}

              <div className="forgot-form-group">

                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <div className="forgot-password-container">

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="forgot-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>
              </>}


              {/* ERROR */}

              {error && (
                <div className="forgot-error">
                  {error}
                </div>
              )}


              {/* SUCCESS */}

              {message && (
                <div className="forgot-success">
                  {message}
                </div>
              )}


              {/* BUTTON */}

              <button
                type="submit"
                className="reset-button"
                disabled={loading}
              >
                {loading
                  ? (codeRequested ? "Resetting Password..." : "Sending code...")
                  : (codeRequested ? "Reset Password" : "Send reset code")}
              </button>

            </form>


            {/* BACK TO LOGIN */}

            <div className="back-login">

              Remember your password?{" "}

              <Link to="/login">
                Back to Login
              </Link>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default ForgotPassword;
