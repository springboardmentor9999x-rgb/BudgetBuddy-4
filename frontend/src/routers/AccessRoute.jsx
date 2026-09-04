import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";

export default function AccessRoute({ type, children }) {
  const [account, setAccount] = useState(null);
  const [done, setDone] = useState(false);
  useEffect(() => { Promise.all([api.get("/auth/me"), type === "premium" ? api.get("/membership/me") : Promise.resolve(null)]).then(([identity, membership]) => setAccount({ ...identity.data, ...(membership?.data || {}) })).finally(() => setDone(true)); }, [type]);
  if (!done) return <div className="auth-checking">Checking access...</div>;
  if (type === "admin" && account?.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (type === "premium" && account?.plan !== "premium" && account?.role !== "admin") return <Navigate to="/premium" replace />;
  return children;
}
