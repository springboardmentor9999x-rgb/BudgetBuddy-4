import { useEffect, useState } from "react";

import { getNotifications } from "../services/notificationService";

function RecentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.slice(0, 5));
      } catch {
        // Non-critical widget - fail silently rather than breaking the dashboard.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card shadow p-4">
      <h4>Recent Notifications</h4>

      {loading && <p className="text-muted mt-2">Loading...</p>}

      {!loading && notifications.length === 0 && (
        <p className="text-muted mt-2">No notifications yet.</p>
      )}

      {!loading && notifications.length > 0 && (
        <ul className="list-group list-group-flush mt-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`list-group-item ${n.is_read ? "" : "fw-semibold"}`}
              style={{ fontSize: "0.9rem" }}
            >
              <div className="d-flex justify-content-between">
                <span>{n.title}</span>
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                {n.message}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentNotifications;
