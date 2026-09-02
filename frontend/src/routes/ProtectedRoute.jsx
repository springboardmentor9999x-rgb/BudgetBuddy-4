import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const {
    token,
    user,
    loading,
  } = useAuth();

  // Wait for authentication state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Role restriction
  if (
    allowedRoles &&
    (!user || !allowedRoles.includes(user.role))
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;