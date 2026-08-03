import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);

  // -------------------------
  // Signup
  // -------------------------
  const signup = async (data) => {
    const response = await api.post(
      "/auth/signup",
      data
    );

    return response.data;
  };

  // -------------------------
  // Verify Email OTP
  // -------------------------
  const verifyEmail = async (email, code) => {
    const response = await api.post(
      "/auth/verify-email",
      null,
      {
        params: {
          email,
          code,
        },
      }
    );

    return response.data;
  };

  // -------------------------
  // Resend Verification OTP
  // -------------------------
  const resendVerification = async (email) => {
    const response = await api.post(
      "/auth/resend-verification",
      null,
      {
        params: {
          email,
        },
      }
    );

    return response.data;
  };

  // -------------------------
  // Login
  // -------------------------
  const login = async (email, password) => {
    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post(
      "/auth/login",
      formData
    );

    const accessToken =
      response.data.access_token;

    // Save JWT token
    localStorage.setItem(
      "token",
      accessToken
    );

    setToken(accessToken);

    // Get current logged-in user
    const me = await api.get(
      "/auth/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    setUser(me.data);

    return me.data;
  };

  // -------------------------
  // Delete Account
  // -------------------------
  const deleteAccount = async (password) => {
    const response = await api.delete(
      "/auth/account",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        data: {
          password: password,
        },
      }
    );

    // Account has been deleted,
    // so remove login information
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);

    return response.data;
  };

  // -------------------------
  // Logout
  // -------------------------
  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,

        signup,
        verifyEmail,
        resendVerification,

        login,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);