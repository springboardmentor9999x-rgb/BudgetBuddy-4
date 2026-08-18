import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/axios";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState(() => localStorage.getItem("token") ? "checking" : "signed-out");

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");
    if (!token) { setStatus("signed-out"); return () => { active = false; }; }

    api.get("/auth/me")
      .then((response) => {
        if (!response.data?.is_verified) throw new Error("Account email is not verified.");
        if (active) setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (active) setStatus("signed-out");
      });

    return () => { active = false; };
  }, []);

  if (status === "checking") return <div className="auth-checking">Checking your secure session…</div>;
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default ProtectedRoute;
