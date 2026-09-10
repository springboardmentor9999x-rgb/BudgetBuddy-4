import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../../utils/notifications";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  getAllUsers,
  activateUser,
  deactivateUser,
  deleteUser,
  updateUserTier,
} from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setLoadError(
          "This session is no longer authorized as Admin " +
          "(it may have been replaced by a login in another tab). " +
          "Please log in again as Admin."
        );
      } else {
        setLoadError(
          "Failed to load users. " +
          (error?.response?.data?.detail || "Please try again.")
        );
      }
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (targetUser) => {
    setBusyId(targetUser.id);
    try {
      if (targetUser.is_active) {
        await deactivateUser(targetUser.id);
        toast.success(`${targetUser.email} deactivated`);
      } else {
        await activateUser(targetUser.id);
        toast.success(`${targetUser.email} activated`);
      }
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleTier = async (targetUser, tier) => {
    setBusyId(targetUser.id);
    try {
      await updateUserTier(targetUser.id, tier);
      toast.success(`${targetUser.email} is now ${tier}.`);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Tier update failed");
    } finally { setBusyId(null); }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Permanently delete ${targetUser.email}? This cannot be undone.`)) {
      return;
    }

    setBusyId(targetUser.id);
    try {
      await deleteUser(targetUser.id);
      toast.success(`${targetUser.email} deleted`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Sidebar />
      <Navbar />
      <ToastContainer />

      <main className="bb-admin-page">
        <h2 className="mb-4">👥 User Management</h2>

        {loading && <LoadingSpinner />}

        {!loading && loadError && (
          <div className="alert alert-danger" role="alert">
            {loadError}
          </div>
        )}

        {!loading && !loadError && (
          <div className="card shadow-sm p-3">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Verified</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.role === "admin" ? "table-warning fw-bold" : ""}>
                      <td>{u.id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.email}{u.role === "admin" && <span className="badge bg-dark ms-2">PRIMARY ADMIN</span>}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "bg-dark" : "bg-secondary"}`}>{u.role}</span>
                      </td>
                      <td>
                        {u.role === "admin" ? <span className="badge bg-dark">Admin</span> : (
                          <select className="form-select form-select-sm" value={u.account_tier || "normal"}
                            disabled={busyId === u.id} onChange={(e) => handleTier(u, e.target.value)}>
                            <option value="normal">Normal</option><option value="premium">Premium</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.is_verified ? "bg-success" : "bg-warning"}`}>
                          {u.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? "bg-success" : "bg-danger"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="d-flex gap-2">
                        <button
                          className={`btn btn-sm ${u.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                          disabled={busyId === u.id || u.id === currentAdmin?.id}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-dark"
                          disabled={busyId === u.id || u.id === currentAdmin?.id}
                          onClick={() => handleDelete(u)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default AdminUsers;
