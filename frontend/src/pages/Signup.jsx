import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Signup.css";


/* =========================================
   PASSWORD STRENGTH CHECK
========================================= */

const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) {
    return {
      score: 0,
      label: "",
      className: "",
    };
  }

  if (score <= 2) {
    return {
      score: 1,
      label: "Weak password",
      className: "weak",
    };
  }

  if (score <= 4) {
    return {
      score: 2,
      label: "Medium password",
      className: "medium",
    };
  }

  return {
    score: 3,
    label: "Strong password",
    className: "strong",
  };
};


function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength =
    getPasswordStrength(password);


  /* =========================================
     SIGNUP
  ========================================= */

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (passwordStrength.score < 2) {
      setError(
        "Please choose a stronger password."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/signup",
        {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
        }
      );

      setMessage(response.data.message);
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Signup failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signup-page">

      <div className="signup-container">

        {/* =====================================
            LEFT SIDE
        ====================================== */}

        <section className="signup-left">

          <div className="signup-brand">

            <div className="signup-brand-icon">
              ₹
            </div>

            <span>BudgetBuddy</span>

          </div>


          <div className="signup-welcome">

            <p className="signup-hello">
              Welcome!
            </p>

            <h1>
              Start Your
              <br />

              <strong>
                SMART JOURNEY
              </strong>
            </h1>

            <p className="signup-description">
              Create your BudgetBuddy account and
              start tracking expenses, managing
              your budget and building better
              financial habits.
            </p>

          </div>


          <div
            className="
              signup-decoration
              signup-decoration-one
            "
          />

          <div
            className="
              signup-decoration
              signup-decoration-two
            "
          />

        </section>


        {/* =====================================
            RIGHT SIDE
        ====================================== */}

        <section className="signup-right">

          <div className="signup-form-container">

            <h2>Create Account</h2>

            <p className="signup-subtitle">
              Join BudgetBuddy and start managing
              your money smarter.
            </p>


            <form onSubmit={handleSignup}>

              {/* FULL NAME */}

              <div className="signup-form-group">

                <label htmlFor="fullName">
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  autoComplete="name"
                />

              </div>


              {/* EMAIL */}

              <div className="signup-form-group">

                <label htmlFor="signupEmail">
                  Email Address
                </label>

                <input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                />

              </div>


              {/* PASSWORD */}

              <div className="signup-form-group">

                <label htmlFor="signupPassword">
                  Password
                </label>

                <div className="signup-password-container">

                  <input
                    id="signupPassword"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />


                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>


                {/* PASSWORD STRENGTH */}

                {password && (

                  <div className="password-strength">

                    <div className="strength-bars">

                      <div
                        className={`strength-bar ${
                          passwordStrength.score >= 1
                            ? passwordStrength.className
                            : ""
                        }`}
                      />

                      <div
                        className={`strength-bar ${
                          passwordStrength.score >= 2
                            ? passwordStrength.className
                            : ""
                        }`}
                      />

                      <div
                        className={`strength-bar ${
                          passwordStrength.score >= 3
                            ? passwordStrength.className
                            : ""
                        }`}
                      />

                    </div>


                    <div className="strength-info">

                      <span
                        className={`strength-text ${passwordStrength.className}`}
                      >
                        {passwordStrength.label}
                      </span>

                    </div>

                  </div>

                )}


                {/* PASSWORD REQUIREMENTS */}

                {password && (
                  <div className="password-requirements">

                    <span
                      className={
                        password.length >= 8
                          ? "requirement-valid"
                          : ""
                      }
                    >
                      8+ characters
                    </span>

                    <span
                      className={
                        /[A-Z]/.test(password)
                          ? "requirement-valid"
                          : ""
                      }
                    >
                      Uppercase
                    </span>

                    <span
                      className={
                        /[0-9]/.test(password)
                          ? "requirement-valid"
                          : ""
                      }
                    >
                      Number
                    </span>

                    <span
                      className={
                        /[^A-Za-z0-9]/.test(password)
                          ? "requirement-valid"
                          : ""
                      }
                    >
                      Special character
                    </span>

                  </div>
                )}

              </div>


              {/* CONFIRM PASSWORD */}

              <div className="signup-form-group">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="signup-password-container">

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                  />


                  <button
                    type="button"
                    className="signup-password-toggle"
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


                {/* PASSWORD MATCH */}

                {confirmPassword && (
                  <div
                    className={
                      password === confirmPassword
                        ? "password-match"
                        : "password-not-match"
                    }
                  >
                    {password === confirmPassword
                      ? "✓ Passwords match"
                      : "Passwords do not match"}
                  </div>
                )}

              </div>


              {/* ERROR */}

              {error && (
                <div className="signup-error">
                  {error}
                </div>
              )}


              {/* SUCCESS */}

              {message && (
                <div className="signup-success">
                  {message}
                </div>
              )}


              {/* CREATE ACCOUNT BUTTON */}

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >

                {loading
                  ? "Sending verification email..."
                  : "Create Account"}

              </button>

            </form>


            <div className="signup-login-link">

              Already have an account?{" "}

              <Link to="/login">
                Sign In
              </Link>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Signup;
