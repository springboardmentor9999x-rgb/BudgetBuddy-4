import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      const token = response.data.access_token;

      if (!token) {
        setError("Login failed. Token was not received.");
        return;
      }

      localStorage.setItem("token", token);

      await api.get("/auth/me");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* LEFT SIDE */}
        <section className="auth-left">

          <div className="brand">
            <div className="brand-icon">₹</div>
            <span>BudgetBuddy</span>
          </div>

          <div className="welcome-text">
            <p className="hello-text">Hello!</p>

            <h1>
              Have a
              <br />
              <strong>GOOD DAY</strong>
            </h1>

            <p className="welcome-description">
              Take control of your money, track your expenses
              and build better financial habits.
            </p>
          </div>

          <div className="decoration decoration-one"></div>
          <div className="decoration decoration-two"></div>

        </section>

        {/* RIGHT SIDE */}
        <section className="auth-right">

          <div className="login-form-container">

            <h2>Login</h2>

            <p className="login-subtitle">
              Welcome back! Please enter your details.
            </p>

            <form onSubmit={handleLogin}>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <div className="password-container">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
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

              <div className="forgot-row">
                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </button>

            </form>

            <div className="create-account">
              Don't have an account?{" "}
              <Link to="/signup">
                Create an account
              </Link>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}

export default Login;
