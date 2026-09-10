import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../../utils/notifications";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  getPremiumRequests,
  approvePremiumRequest,
  rejectPremiumRequest,
} from "../../services/adminService";

function AdminPremiumRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = async (status) => {
    setLoading(true);
    try {
      const data = await getPremiumRequests(status === "all" ? undefined : status);
      setRequests(data);
    } catch {
      toast.error("Failed to load Premium requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (req) => {
    setBusyId(req.id);
    try {
      await approvePremiumRequest(req.id);
      toast.success(`${req.email} is now Premium.`);
      load(filter);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (req) => {
    setBusyId(req.id);
    try {
      await rejectPremiumRequest(req.id);
      toast.success(`Request from ${req.email} rejected.`);
      load(filter);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Reject failed");
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">💎 Premium Requests</h2>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && requests.length === 0 && (
          <div className="card shadow-sm p-4 text-center text-muted">
            No {filter !== "all" ? filter : ""} Premium requests.
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="card shadow-sm p-3">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Plan</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.full_name || "—"}</td>
                      <td>{r.email}</td>
                      <td>
                        <span className={`badge ${r.account_tier === "premium" ? "bg-success" : "bg-secondary"}`}>
                          {r.account_tier === "premium" ? "Premium" : "Normal"}
                        </span>
                      </td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === "approved"
                              ? "bg-success"
                              : r.status === "rejected"
                              ? "bg-danger"
                              : "bg-warning"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="d-flex gap-2">
                        {r.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success"
                              disabled={busyId === r.id}
                              onClick={() => handleApprove(r)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={busyId === r.id}
                              onClick={() => handleReject(r)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-muted">Reviewed</span>
                        )}
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

export default AdminPremiumRequests;
