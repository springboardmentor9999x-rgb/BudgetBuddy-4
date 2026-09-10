import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../../utils/notifications";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../components/LoadingSpinner";

import { getActivityLogs } from "../../services/adminService";

const SEVERITY_BADGE = {
  security: "bg-danger",
  warning: "bg-warning text-dark",
  success: "bg-success",
  info: "bg-secondary",
};

function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getActivityLogs();
        setLogs(data);
      } catch {
        toast.error("Failed to load activity logs.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = severityFilter === "All"
    ? logs
    : logs.filter((l) => l.severity === severityFilter);

  return (
    <>
      <Sidebar />
      <Navbar />
      <ToastContainer />

      <main className="bb-admin-page bb-activity-page">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <h2 className="mb-0">📜 System Activity Logs</h2>

          <select
            className="form-select"
            style={{ width: "200px" }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="security">Security</option>
            <option value="info">Info</option>
          </select>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && (
          <div className="card shadow-sm p-3">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User ID</th>
                    <th>Severity</th>
                    <th>Action</th>
                    <th>Detail</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_id ?? <span className="text-muted">—</span>}</td>
                      <td>
                        <span className={`badge ${SEVERITY_BADGE[log.severity] || "bg-secondary"}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>{log.action}</td>
                      <td>{log.detail || "—"}</td>
                      <td>{log.ip_address || "—"}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-3">
                        No activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default AdminActivityLogs;
