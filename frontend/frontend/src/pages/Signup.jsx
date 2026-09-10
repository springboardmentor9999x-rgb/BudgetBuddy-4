import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    toast,
    ToastContainer,
} from "../utils/notifications";

import {
    signupUser,
} from "../services/authService";

import PasswordStrength from "../components/PasswordStrength";

import {
    validateEmail,
    validatePassword,
} from "../utils/validators";

import "../styles/signup.css";

function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone_number: "",
        requested_tier: "normal",
        password: "",
        confirm_password: "",
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    // =======================================================
    // HANDLE INPUT
    // =======================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =======================================================
    // SIGNUP
    // =======================================================

    const handleSignup = async (event) => {
        event.preventDefault();

        const cleanName =
            form.full_name.trim();

        const cleanEmail =
            form.email.trim().toLowerCase();

        // ---------------------------------------------------
        // NAME
        // ---------------------------------------------------

        if (!cleanName) {
            toast.error(
                "Please enter your full name."
            );

            return;
        }

        // ---------------------------------------------------
        // EMAIL
        // ---------------------------------------------------

        if (!validateEmail(cleanEmail)) {
            toast.error(
                "Please enter a valid email address."
            );

            return;
        }

        // ---------------------------------------------------
        // PASSWORD
        // ---------------------------------------------------

        if (!validatePassword(form.password)) {
            toast.error(
                "Password must contain 8+ characters, uppercase, lowercase, number and special character."
            );

            return;
        }

        // ---------------------------------------------------
        // CONFIRM PASSWORD
        // ---------------------------------------------------

        if (
            form.password !==
            form.confirm_password
        ) {
            toast.error(
                "Passwords do not match."
            );

            return;
        }

        try {
            setLoading(true);

            const result =
                await signupUser({
                    full_name: cleanName,
                    email: cleanEmail,
                    phone_number: form.phone_number.trim() || null,
                    requested_tier: form.requested_tier,
                    password: form.password,
                    confirm_password:
                        form.confirm_password,
                });

            // Save email for verification page.
            sessionStorage.setItem(
                "verificationEmail",
                cleanEmail
            );

            toast.success(
                result?.message ||
                "Account created. Check your email for the verification code."
            );

            window.setTimeout(() => {
                navigate(
                    "/verify-email",
                    {
                        replace: true,
                        state: {
                            email: cleanEmail,
                        },
                    }
                );
            }, 650);

        } catch (error) {
            const detail =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.userMessage ||
                error?.message ||
                "Unable to create your account.";

            toast.error(detail);

        } finally {
            setLoading(false);
        }
    };

    // =======================================================
    // UI
    // =======================================================

    return (
        <div className="auth-page signup-page">

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

                        <div className="finance-illustration wallet-illustration">

                            <div className="wallet">

                                <div className="wallet-flap" />

                                <div className="wallet-button" />

                            </div>

                        </div>

                        <h1>
                            Build better{" "}
                            <span>
                                money habits.
                            </span>
                        </h1>

                        <p>
                            One simple place to understand
                            your spending, plan your budget
                            and reach your savings goals.
                        </p>

                        <div className="benefit-list">

                            <div>
                                <span>✓</span>
                                Personal financial dashboard
                            </div>

                            <div>
                                <span>✓</span>
                                Smart expense management
                            </div>

                            <div>
                                <span>✓</span>
                                Email verification security
                            </div>

                            <div>
                                <span>✓</span>
                                Budget &amp; savings goal tracking
                            </div>

                        </div>

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

                        <div className="top-switch">

                            <span>
                                Already have an account?
                            </span>

                            <Link to="/">
                                Sign in
                            </Link>

                        </div>

                        <div className="form-heading">

                            <div className="form-icon">
                                +
                            </div>

                            <div>

                                <small>
                                    GET STARTED
                                </small>

                                <h2>
                                    Create your account
                                </h2>

                                <p>
                                    Start managing your finances
                                    smarter with BudgetBuddy.
                                </p>

                            </div>

                        </div>

                        <form
                            onSubmit={handleSignup}
                            noValidate
                        >

                            {/* FULL NAME */}

                            <div className="field-group">

                                <label htmlFor="full-name">
                                    Full name
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        ♙
                                    </span>

                                    <input
                                        id="full-name"
                                        type="text"
                                        name="full_name"
                                        placeholder="Enter your full name"
                                        value={form.full_name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        disabled={loading}
                                    />

                                </div>

                            </div>

                            {/* EMAIL */}

                            <div className="field-group">

                                <label htmlFor="signup-email">
                                    Email address
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        ✉
                                    </span>

                                    <input
                                        id="signup-email"
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={form.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        disabled={loading}
                                    />

                                </div>

                            </div>

                            {/* PHONE */}

                            <div className="field-group">
                                <label htmlFor="signup-phone">Phone number</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">☎</span>
                                    <input id="signup-phone" type="tel" name="phone_number" placeholder="+91XXXXXXXXXX" value={form.phone_number} onChange={handleChange} autoComplete="tel" disabled={loading} />
                                </div>
                            </div>

                            {/* Account type: every signup creates a Normal account.
                                Premium is granted only after an admin approves a
                                premium request from within the app - it is never a
                                signup-time choice. */}

                            {/* PASSWORD */}

                            <div className="field-group">

                                <label htmlFor="signup-password">
                                    Password
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        🔒
                                    </span>

                                    <input
                                        id="signup-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        placeholder="Create a strong password"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
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

                                {form.password && (
                                    <PasswordStrength
                                        password={
                                            form.password
                                        }
                                    />
                                )}

                            </div>

                            {/* CONFIRM PASSWORD */}

                            <div className="field-group">

                                <label htmlFor="confirm-password">
                                    Confirm password
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        🔒
                                    </span>

                                    <input
                                        id="confirm-password"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirm_password"
                                        placeholder="Confirm your password"
                                        value={
                                            form.confirm_password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (value) =>
                                                    !value
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showConfirmPassword
                                            ? "◉"
                                            : "◌"}
                                    </button>

                                </div>

                                {form.confirm_password && (
                                    <div
                                        className={
                                            `password-match ${
                                                form.password ===
                                                form.confirm_password
                                                    ? "success"
                                                    : "error"
                                            }`
                                        }
                                    >
                                        {form.password ===
                                        form.confirm_password
                                            ? "✓ Passwords match"
                                            : "Passwords do not match"}
                                    </div>
                                )}

                            </div>

                            {/* VERIFICATION NOTE */}

                            <div className="terms-row">

                                <span className="check-mark">
                                    ✓
                                </span>

                                <p>
                                    Your account will be protected
                                    with email verification. After
                                    signup, enter the 6-digit code
                                    sent to this email.
                                </p>

                            </div>

                            {/* SIGNUP BUTTON */}

                            <button
                                className="auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create Account"}

                                {!loading && (
                                    <span className="button-arrow">
                                        →
                                    </span>
                                )}
                            </button>

                        </form>

                        <div className="security-note">

                            <span>
                                🛡
                            </span>

                            <p>
                                Secure authentication protects
                                your financial information and
                                account access.
                            </p>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
}

export default Signup;