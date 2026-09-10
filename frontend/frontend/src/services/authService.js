import api from "./api";

// =========================================================
// HELPERS
// =========================================================

const normalizeEmail = (email) => {
    return String(email || "")
        .trim()
        .toLowerCase();
};

const getErrorMessage = (error, fallback) => {
    return (
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};

// =========================================================
// AUTH STORAGE
// =========================================================

export const clearAuthStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
};

export const getCurrentUser = () => {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);
    } catch {
        return null;
    }
};

export const isLoggedIn = () => {
    return Boolean(localStorage.getItem("token"));
};

// =========================================================
// SIGNUP
// =========================================================

export const signupUser = async (user) => {
    try {
        const payload = {
            full_name: String(user?.full_name || "").trim(),
            email: normalizeEmail(user?.email),
            phone_number: user?.phone_number || null,
            password: user?.password || "",
            confirm_password: user?.confirm_password || "",
            requested_tier: user?.requested_tier === "premium" ? "premium" : "normal",
        };

        const response = await api.post("/auth/signup", payload);

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Account creation could not be completed."
        );

        throw error;
    }
};

// =========================================================
// LOGIN
// =========================================================

export const loginUser = async (email, password) => {
    try {
        // Single login page: only email/password are sent. The account's
        // role/tier is looked up server-side from the database record
        // itself (see routers/auth.py) - there is no client-selected
        // "which tab" concept to send anymore.
        const response = await api.post("/auth/login", {
            email: normalizeEmail(email),
            password: password || "",
        });

        const data = response.data;

        if (!data?.access_token) {
            throw new Error(
                "Login succeeded but the server did not return an access token."
            );
        }

        // Save token immediately.
        localStorage.setItem("token", data.access_token);

        // Save user if backend returns it.
        if (data?.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        }

        // Keep one consistent login timestamp format.
        localStorage.setItem(
            "loginTime",
            new Date().toISOString()
        );

        return data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Unable to sign in. Please check your credentials."
        );

        throw error;
    }
};

// =========================================================
// LOGOUT
// =========================================================

export const getAdminStatus = async () => {
    const response = await api.get("/auth/admin-status");
    return response.data;
};

export const bootstrapAdmin = async () => {
    const response = await api.post("/auth/bootstrap-admin");
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await api.post("/auth/logout");

        return response.data;
    } finally {
        clearAuthStorage();
    }
};

export const logout = () => {
    clearAuthStorage();
};

// =========================================================
// CURRENT USER
// =========================================================

export const getCurrentUserFromApi = async () => {
    try {
        const response = await api.get("/auth/me");

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Unable to load your account information."
        );

        throw error;
    }
};

// =========================================================
// EMAIL VERIFICATION
// =========================================================

export const verifyEmail = async (email, otp) => {
    try {
        const response = await api.post(
            "/auth/verify-email",
            {
                email: normalizeEmail(email),
                otp: String(otp || "").trim(),
            }
        );

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Email verification failed."
        );

        throw error;
    }
};

// =========================================================
// RESEND VERIFICATION
// =========================================================

export const resendVerification = async (email) => {
    try {
        const response = await api.post(
            "/auth/resend-verification",
            {
                email: normalizeEmail(email),
            }
        );

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Could not resend the verification email."
        );

        throw error;
    }
};

// =========================================================
// FORGOT PASSWORD
// =========================================================

export const forgotPassword = async (email) => {
    try {
        const response = await api.post(
            "/auth/forgot-password",
            {
                email: normalizeEmail(email),
            }
        );

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Unable to request password reset."
        );

        throw error;
    }
};

// =========================================================
// RESET PASSWORD
// =========================================================

export const resetPassword = async (
    token,
    newPassword,
    confirmNewPassword
) => {
    try {
        const response = await api.post(
            `/auth/reset-password/${encodeURIComponent(token)}`,
            {
                new_password: newPassword,
                confirm_new_password: confirmNewPassword,
            }
        );

        return response.data;
    } catch (error) {
        error.userMessage = getErrorMessage(
            error,
            "Unable to reset password."
        );

        throw error;
    }
};