import { useEffect, useState } from "react";

import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notification";

import ProtectedLayout from "../components/ProtectedLayout";


function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);


  // =========================================================
  // Load Notifications
  // =========================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data || []);

    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // Initial Load
  // =========================================================

  useEffect(() => {
    loadNotifications();
  }, []);


  // =========================================================
  // Mark Notification as Read
  // =========================================================

  const handleRead = async (notification) => {
    if (notification.is_read) {
      return;
    }

    try {
      const updated =
        await markNotificationAsRead(
          notification.id
        );

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };


  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <ProtectedLayout>

        <div style={styles.container}>

          <h1 style={styles.title}>
            Notifications
          </h1>

          <p style={styles.subtitle}>
            Loading notifications...
          </p>

        </div>

      </ProtectedLayout>
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <ProtectedLayout>

      <div style={styles.container}>

        {/* =================================================
            Header
        ================================================= */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Notifications
            </h1>

            <p style={styles.subtitle}>
              Stay updated with your BudgetBuddy activity.
            </p>

          </div>


          {/* Refresh */}

          <button
            style={styles.refreshButton}
            onClick={loadNotifications}
          >
            Refresh
          </button>

        </div>


        {/* =================================================
            Empty State
        ================================================= */}

        {notifications.length === 0 ? (

          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              🔔
            </div>

            <h2 style={styles.emptyTitle}>
              No notifications
            </h2>

            <p style={styles.emptyText}>
              You're all caught up!
            </p>

          </div>

        ) : (

          /* =================================================
             Notification List
          ================================================= */

          <div style={styles.list}>

            {notifications.map(
              (notification) => (

                <div
                  key={notification.id}
                  onClick={() =>
                    handleRead(
                      notification
                    )
                  }
                  style={{
                    ...styles.notification,

                    ...(notification.is_read
                      ? styles.read
                      : styles.unread),
                  }}
                >

                  {/* =================================================
                      Icon
                  ================================================= */}

                  <div style={styles.icon}>

                    {notification.type ===
                    "goal_milestone"
                      ? "🎯"
                      : notification.type ===
                        "budget_alert"
                      ? "⚠️"
                      : notification.type ===
                        "monthly_report"
                      ? "📊"
                      : "🔔"}

                  </div>


                  {/* =================================================
                      Content
                  ================================================= */}

                  <div style={styles.content}>

                    <div style={styles.message}>

                      {notification.message}

                    </div>


                    {notification.created_at && (

                      <div style={styles.date}>

                        {new Date(
                          notification.created_at
                        ).toLocaleString()}

                      </div>

                    )}

                  </div>


                  {/* =================================================
                      New Badge
                  ================================================= */}

                  {!notification.is_read && (

                    <div style={styles.badge}>
                      New
                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

      </div>

    </ProtectedLayout>
  );
}


// =========================================================
// Styles
// =========================================================

const styles = {

  container: {
    padding: "35px",
    minHeight: "100%",
    background: "#f4f7fb",
  },


  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },


  title: {
    fontSize: "38px",
    fontWeight: "700",
    margin: 0,
    color: "#1f2937",
  },


  subtitle: {
    color: "#6b7280",
    fontSize: "16px",
    marginTop: "8px",
  },


  refreshButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },


  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "900px",
  },


  notification: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "20px",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.08)",
    transition: "0.2s",
  },


  unread: {
    background: "#ffffff",
    borderLeft: "5px solid #2563eb",
  },


  read: {
    background: "#eef2f7",
    borderLeft: "5px solid #9ca3af",
  },


  icon: {
    width: "45px",
    height: "45px",
    minWidth: "45px",
    borderRadius: "50%",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },


  content: {
    flex: 1,
  },


  message: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: "1.5",
  },


  date: {
    marginTop: "7px",
    fontSize: "13px",
    color: "#6b7280",
  },


  badge: {
    background: "#2563eb",
    color: "white",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },


  empty: {
    background: "white",
    padding: "60px",
    borderRadius: "15px",
    textAlign: "center",
    maxWidth: "700px",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.05)",
  },


  emptyIcon: {
    fontSize: "50px",
    marginBottom: "15px",
  },


  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
  },


  emptyText: {
    color: "#6b7280",
    marginTop: "8px",
  },
};


export default Notifications;