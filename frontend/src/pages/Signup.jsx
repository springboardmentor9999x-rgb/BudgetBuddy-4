import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import Logo from "../components/Logo";
import Card from "../components/Card";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import PasswordStrength from "../components/PasswordStrength";
import Button from "../components/Button";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------
    // Full Name Validation
    // -------------------------
    if (form.full_name.trim().length < 3) {
      toast.error(
        "Full name must be at least 3 characters."
      );
      return;
    }

    // -------------------------
    // Email Validation
    // -------------------------
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      toast.error(
        "Please enter a valid email address."
      );
      return;
    }

    // -------------------------
    // Strong Password Validation
    // -------------------------
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!strongPassword.test(form.password)) {
      toast.error(
        "Password must contain uppercase, lowercase, number and special character."
      );
      return;
    }

    // -------------------------
    // Confirm Password
    // -------------------------
    if (
      form.password !== form.confirmPassword
    ) {
      toast.error(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      // Create account
      await signup({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      // Top-corner notification
      toast.success(
        "Verification code sent to your email!"
      );

      // Go to OTP verification page
      navigate(
        "/verify-email",
        {
          state: {
            email: form.email.trim(),
          },
        }
      );

    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <Card>
          <Logo />

          <h2 className="text-2xl font-bold text-center text-gray-900">
            Create Account
          </h2>

          <p className="text-center text-gray-500 mt-2 mb-8">
            Create your BudgetBuddy account
          </p>

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <Input
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

            {/* Password */}
            <PasswordInput
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
            />

            <PasswordStrength
              password={form.password}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />

            {/* Password Match */}
            {form.confirmPassword && (
              <p
                className={`mb-5 text-sm font-medium ${
                  form.password ===
                  form.confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {form.password ===
                form.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}

            {/* Create Account */}
            <Button
              type="submit"
              loading={loading}
            >
              Create Account
            </Button>

          </form>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>

        </Card>

      </div>
    </div>
  );
}

export default Signup;