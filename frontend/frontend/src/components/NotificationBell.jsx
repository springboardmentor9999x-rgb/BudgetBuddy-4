import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService";

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Maps notification category -> a severity color, so the bell gives a
// quick visual read (security/warning events stand out from routine ones).
const CATEGORY_COLOR = {
  budget_alert: "#ffc107",
  login_alert: "#0dcaf0",
  password_changed: "#dc3545",
  admin_announcement: "#6f42c1",
  registration: "#198754",
  bank: "#198754",
  income: "#198754",
  savings_goal: "#198754",
  system: "#6c757d",
};

function categoryColor(category) {
  return CATEGORY_COLOR[category] || "#6c757d";
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const refreshUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently ignore - notification bell shouldn't break the page
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    refreshUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    refreshUnreadCount();
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }} className="me-4">
      <div style={{ position: "relative", cursor: "pointer" }} onClick={toggleOpen}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span
            className="badge bg-danger rounded-pill"
            style={{
              position: "absolute",
              top: -8,
              right: -10,
              fontSize: "0.6rem",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {open && (
        <div
          className="card shadow"
          style={{
            position: "absolute",
            right: 0,
            top: "30px",
            width: "340px",
            maxHeight: "420px",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <strong>Notifications</strong>
            {notifications.length > 0 && (
              <button
                className="btn btn-sm btn-link p-0"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && <div className="p-3 text-center text-muted">Loading...</div>}

          {!loading && notifications.length === 0 && (
            <div className="p-3 text-center text-muted">
              You're all caught up.
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2 border-bottom ${n.is_read ? "" : "bg-light"}`}
                style={{ fontSize: "0.85rem" }}
              >
                <div className="d-flex justify-content-between">
                  <span className="d-flex align-items-center gap-1">
                    <span
                      title={n.category}
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: categoryColor(n.category),
                        flexShrink: 0,
                      }}
                    />
                    <strong>{n.title}</strong>
                  </span>
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <div className="text-muted">{n.message}</div>
                <div className="mt-1 d-flex gap-2">
                  {!n.is_read && (
                    <button
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger py-0 px-2"
                    onClick={() => handleDelete(n.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
