import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    toast,
    ToastContainer,
} from "../utils/notifications";

import { useAuth } from "../context/AuthContext";

import {
    resendVerification,
} from "../services/authService";

import "../styles/login.css";

function Login() {
    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [showResend, setShowResend] =
        useState(false);

    // =======================================================
    // LOGIN
    // =======================================================

    const handleLogin = async (event) => {
        event.preventDefault();

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            toast.error(
                "Please enter your email address and password."
            );

            return;
        }

        try {
            setLoading(true);
            setShowResend(false);

            const result =
                await login(
                    cleanEmail,
                    password
                );

            // Store verification email
            // in case another page needs it.
            sessionStorage.setItem(
                "verificationEmail",
                cleanEmail
            );

            toast.success(
                "Welcome back to BudgetBuddy!"
            );

            // Small delay so toast is visible.
            window.setTimeout(() => {
                navigate(
                    "/dashboard",
                    { replace: true }
                );
            }, 500);

            return result;
        } catch (error) {
            const detail =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.userMessage ||
                error?.message ||
                "Unable to sign in. Please check your credentials.";

            toast.error(detail);

            // Show resend button when backend
            // indicates verification is required.
            if (
                /verify|verification|verified|otp/i.test(
                    String(detail)
                )
            ) {
                setShowResend(true);

                sessionStorage.setItem(
                    "verificationEmail",
                    cleanEmail
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // =======================================================
    // RESEND VERIFICATION
    // =======================================================

    const handleResend = async () => {
        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail) {
            toast.error(
                "Enter your email address first."
            );

            return;
        }

        try {
            setLoading(true);

            await resendVerification(
                cleanEmail
            );

            sessionStorage.setItem(
                "verificationEmail",
                cleanEmail
            );

            toast.success(
                "A new verification code has been sent to your email."
            );

            window.setTimeout(() => {
                navigate(
                    "/verify-email",
                    {
                        state: {
                            email: cleanEmail,
                        },
                    }
                );
            }, 500);
        } catch (error) {
            toast.error(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.userMessage ||
                "Unable to resend the verification email."
            );
        } finally {
            setLoading(false);
        }
    };

    // =======================================================
    // UI
    // =======================================================

    return (
        <div className="auth-page">
            <ToastContainer
                position="top-right"
                autoClose={3200}
            />

            <div className="auth-shell">

                {/* =================================================
                    LEFT VISUAL
                ================================================= */}

                <section className="auth-visual">

                    <div className="brand-logo">
                        <div className="brand-mark">
                            ↗
                        </div>

                        <span>
                            Budget
                            <span>
                                Buddy
                            </span>
                        </span>
                    </div>

                    <div className="auth-visual-content">

                        <div className="finance-illustration login-illustration">

                            <div className="phone-shape">

                                <div className="phone-screen">

                                    <div className="mini-chart">
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                    </div>

                                    <div className="mini-card" />

                                    <div className="mini-card short" />

                                </div>

                            </div>

                            <div className="security-shield">
                                ✓
                            </div>

                        </div>

                        <h1>
                            Take control of{" "}
                            <span>
                                your money.
                            </span>
                        </h1>

                        <p>
                            Plan your budget, track
                            expenses, manage income and
                            build your savings — all in
                            one secure place.
                        </p>

                    </div>

                    <div className="visual-footer">
                        SMART PERSONAL FINANCE • BUDGETBUDDY
                    </div>

                </section>

                {/* =================================================
                    RIGHT FORM
                ================================================= */}

                <section className="auth-form-panel">

                    <div className="auth-form-container">

                        <div className="mobile-brand">
                            <div className="brand-mark">
                                ↗
                            </div>

                            <span>
                                Budget
                                <span>
                                    Buddy
                                </span>
                            </span>
                        </div>

                        <div className="form-heading">

                            <div className="form-icon">
                                ⇥
                            </div>

                            <div>
                                <small>
                                    WELCOME BACK
                                </small>

                                <h2>
                                    Sign in to your account
                                </h2>

                                <p>
                                    Continue managing your
                                    finances with BudgetBuddy.
                                </p>
                            </div>

                        </div>

                        <form
                            onSubmit={handleLogin}
                            noValidate
                        >

                            {/* Single login form - no Normal/Premium/Admin
                                selection here. The account that owns this
                                email/password determines role and tier;
                                the server reads that from the database,
                                it is never chosen on this screen. */}

                            {/* EMAIL */}

                            <div className="field-group">

                                <label htmlFor="login-email">
                                    Email address
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        ✉
                                    </span>

                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="email"
                                        disabled={loading}
                                    />

                                </div>

                            </div>

                            {/* PASSWORD */}

                            <div className="field-group">

                                <div className="label-row">

                                    <label htmlFor="login-password">
                                        Password
                                    </label>

                                    <Link to="/forgot-password">
                                        Forgot password?
                                    </Link>

                                </div>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        🔒
                                    </span>

                                    <input
                                        id="login-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="current-password"
                                        disabled={loading}
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (value) =>
                                                    !value
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword
                                            ? "◉"
                                            : "◌"}
                                    </button>

                                </div>

                            </div>

                            {/* LOGIN BUTTON */}

                            <button
                                className="auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing in..."
                                    : "Sign In"}

                                {!loading && (
                                    <span className="button-arrow">
                                        →
                                    </span>
                                )}
                            </button>

                            {/* RESEND */}

                            {showResend && (
                                <button
                                    type="button"
                                    className="resend-button"
                                    onClick={
                                        handleResend
                                    }
                                    disabled={loading}
                                >
                                    Email not verified?
                                    Resend verification code
                                </button>
                            )}

                        </form>

                        <>
                                <div className="auth-divider">

                                    <span />

                                    <p>
                                        New to BudgetBuddy?
                                    </p>

                                    <span />

                                </div>

                                <Link
                                    to="/signup"
                                    className="secondary-auth-button"
                                >
                                    Create your BudgetBuddy account
                                </Link>
                            </>

                        <div className="security-note">

                            <span>
                                🔐
                            </span>

                            <p>
                                Your financial information
                                is protected with secure
                                authentication.
                            </p>

                        </div>

                    </div>

                </section>

            </div>
        </div>
    );
}

export default Login;