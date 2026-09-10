import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If the backend says our token is invalid/expired, clear local auth state
// and send the user back to login instead of leaving them stuck on a broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Only invalidate the local session when the session-validation endpoint
    // itself says the JWT is invalid/expired. A 401 from a feature endpoint
    // must NOT throw the user back to the login page. The page should receive
    // the error and show its own notification instead.
    if (status === 401 && requestUrl.includes("/auth/me")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");

      window.dispatchEvent(
        new CustomEvent("bb:session-expired")
      );

      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
