import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "../utils/notifications";

import { resendVerification, verifyEmail } from "../services/authService";

import "../styles/login.css";

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    const email =
        location.state?.email ||
        sessionStorage.getItem("verificationEmail") ||
        "";

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [seconds, setSeconds] = useState(45);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate("/signup", { replace: true });
            return;
        }
        sessionStorage.setItem("verificationEmail", email);
        inputRefs.current[0]?.focus();
    }, [email, navigate]);

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const timer = window.setInterval(() => {
            setSeconds((value) => Math.max(0, value - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [seconds]);

    const handleChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...code];
        next[index] = digit;
        setCode(next);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const pasted = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        const next = ["", "", "", "", "", ""];
        pasted.split("").forEach((digit, index) => {
            next[index] = digit;
        });
        setCode(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        const otp = code.join("");

        if (!/^\d{6}$/.test(otp)) {
            toast.error("Please enter the complete 6-digit verification code.");
            return;
        }

        try {
            setLoading(true);
            const result = await verifyEmail(email.trim().toLowerCase(), otp);
            setVerified(true);
            sessionStorage.removeItem("verificationEmail");
            toast.success(result.message || "Email verified successfully!");
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Invalid or expired verification code."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (seconds > 0 || resending) return;

        try {
            setResending(true);
            const result = await resendVerification(email.trim().toLowerCase());
            setCode(["", "", "", "", "", ""]);
            setSeconds(45);
            inputRefs.current[0]?.focus();
            toast.success(result.message || "A new verification code has been sent.");
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to resend the verification code."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-page centered-auth">
            <ToastContainer position="top-right" autoClose={3200} />

            <div className="verification-card">
                <Link to="/signup" className="back-link" aria-label="Back to signup">←</Link>

                <div className="verification-illustration">
                    <div className="mail-icon">✉</div>
                    <div className="verified-badge">✓</div>
                </div>

                {!verified ? (
                    <>
                        <div className="verification-heading">
                            <small>ACCOUNT SECURITY</small>
                            <h1>Verify your email</h1>
                            <p>Enter the 6-digit code we sent to</p>
                            <strong>{email}</strong>
                        </div>

                        <form onSubmit={handleVerify}>
                            <div className="otp-container" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => { inputRefs.current[index] = element; }}
                                        className="otp-input"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={index === 0 ? "one-time-code" : "off"}
                                        maxLength={1}
                                        value={digit}
                                        onChange={(event) => handleChange(index, event.target.value)}
                                        onKeyDown={(event) => handleKeyDown(index, event)}
                                        aria-label={`Verification digit ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="resend-row">
                                <span>Didn't receive the code?</span>
                                {seconds > 0 ? (
                                    <span className="countdown">
                                        Resend in 00:{String(seconds).padStart(2, "0")}
                                    </span>
                                ) : (
                                    <button type="button" className="resend-link" onClick={handleResend} disabled={resending}>
                                        {resending ? "Sending..." : "Resend code"}
                                    </button>
                                )}
                            </div>

                            <button className="auth-submit" type="submit" disabled={loading}>
                                {loading ? "Verifying..." : "Verify Code"}
                                {!loading && <span className="button-arrow">→</span>}
                            </button>
                        </form>

                        <div className="verification-help">
                            <span>🔐</span>
                            <p>Your verification code is temporary. Never share it with anyone.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="verification-heading">
                            <small>VERIFICATION COMPLETE</small>
                            <h1>Email verified</h1>
                            <p>Your BudgetBuddy account is ready.</p>
                        </div>

                        <button
                            type="button"
                            className="auth-submit"
                            style={{ marginTop: 26 }}
                            onClick={() => navigate("/", { replace: true })}
                        >
                            Continue to Login <span className="button-arrow">→</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;
