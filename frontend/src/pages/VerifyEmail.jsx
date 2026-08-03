import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";

function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleCodeChange = (e) => {
    // Allow numbers only and maximum 6 digits
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email address is missing. Please sign up again.");
      return;
    }

    if (code.length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(email, code);

      toast.success("Email verified successfully!");

      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Email verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is missing. Please sign up again.");
      return;
    }

    setResending(true);

    try {
      await resendVerification(email);

      toast.success(
        "A new verification code has been sent to your email."
      );

      setCode("");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Could not resend verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card>
          <Logo />

          <h2 className="text-2xl font-bold text-center text-gray-900">
            Verify Your Email
          </h2>

          <p className="text-center text-gray-500 mt-2">
            We sent a 6-digit verification code to
          </p>

          <p className="text-center text-gray-800 font-medium mt-1 mb-7 break-all">
            {email || "your email address"}
          </p>

          <form onSubmit={handleVerify}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <p className="text-sm text-gray-500 mt-2 mb-6">
              The verification code expires in 10 minutes.
            </p>

            <Button
              type="submit"
              loading={loading}
            >
              Verify Email
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-2 text-blue-600 text-sm font-medium hover:underline disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : "Resend Code"}
            </button>
          </div>

          <div className="border-t border-gray-200 mt-7 pt-5 text-center">
            <Link
              to="/signup"
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              ← Back to Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmail;