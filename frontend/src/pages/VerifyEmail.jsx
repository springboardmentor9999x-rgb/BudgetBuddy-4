import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const email = searchParams.get("email") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!email) {
      setError("Your email address is missing. Please sign up again.");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Enter the 6-character code from your email.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/verify-email", { email, code });
      setStatus(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We could not verify this code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="verification-page">
      <section className="verification-card">
        <h1>Email verification</h1>
        <p className="verification-description">
          Enter the 6-character code we sent to <strong>{email || "your email"}</strong>.
        </p>

        {!status && (
          <form className="verification-form" onSubmit={handleSubmit}>
            <input
              aria-label="Verification code"
              autoComplete="one-time-code"
              className="verification-code"
              maxLength="6"
              onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="xxxxxx"
              value={code}
            />
            <button className="verification-submit" disabled={loading} type="submit">
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>
        )}

        {status && <p className="verification-success">{status}</p>}
        {error && <p className="verification-error">{error}</p>}
        {status === "Account created successfully" && (
          <Link className="verification-link" to="/login">
            Go to sign in
          </Link>
        )}
      </section>
    </main>
  );
}

export default VerifyEmail;
