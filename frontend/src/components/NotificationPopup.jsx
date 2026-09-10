import { useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notificationService";
import "../styles/notificationPopup.css";

function iconFor(type, category) {
    if (type === "error" || ["budget_alert", "warning"].includes(category)) {
        return <FaExclamationTriangle />;
    }
    if (type === "info" || ["login_alert", "system", "info"].includes(category)) {
        return <FaInfoCircle />;
    }
    return <FaCheckCircle />;
}

function NotificationPopup() {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const seenRef = useRef(new Set());
    const firstLoadRef = useRef(true);

    const push = (item) => {
        setItems((previous) => [
            {
                ...item,
                popupId: `${Date.now()}-${Math.random()}`,
            },
            ...previous,
        ].slice(0, 4));
    };

    useEffect(() => {
        const handler = (event) => {
            const detail = event.detail || {};
            push({
                type: detail.type || "info",
                title: detail.type === "error"
                    ? "Action needs attention"
                    : detail.type === "warning"
                        ? "Please check this"
                        : "BudgetBuddy",
                message: detail.message || "Action completed.",
            });
        };

        window.addEventListener("bb:toast", handler);
        return () => window.removeEventListener("bb:toast", handler);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setItems([]);
            seenRef.current = new Set();
            firstLoadRef.current = true;
            return undefined;
        }

        let active = true;

        const checkServerNotifications = async () => {
            try {
                const data = await getNotifications(true);
                if (!active || !Array.isArray(data)) return;

                if (firstLoadRef.current) {
                    data.forEach((item) => seenRef.current.add(item.id));
                    firstLoadRef.current = false;
                    return;
                }

                const fresh = data.filter((item) => !seenRef.current.has(item.id));
                fresh.forEach((item) => seenRef.current.add(item.id));

                fresh.slice(0, 2).forEach((item) => {
                    push({
                        type: "server",
                        title: item.title || "New notification",
                        message: item.message || "You have a new BudgetBuddy notification.",
                        category: item.category,
                    });
                });
            } catch {
                // Notification UI must never break the application.
            }
        };

        checkServerNotifications();
        const timer = window.setInterval(checkServerNotifications, 5000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [isAuthenticated]);

    useEffect(() => {
        if (!items.length) return undefined;
        const timer = window.setTimeout(() => {
            setItems((previous) => previous.slice(0, -1));
        }, 4800);
        return () => window.clearTimeout(timer);
    }, [items]);

    if (!items.length) return null;

    return (
        <div className="bb-action-notifications" aria-live="polite">
            {items.map((item) => (
                <div className="bb-action-notification" key={item.popupId}>
                    <div className={`bb-action-notification-icon ${item.type === "error" ? "error" : item.type === "warning" ? "warning" : ""}`}>
                        {iconFor(item.type, item.category)}
                    </div>

                    <div className="bb-action-notification-content">
                        <div className="bb-action-notification-title">{item.title}</div>
                        <div className="bb-action-notification-message">{item.message}</div>
                    </div>

                    <button
                        type="button"
                        className="bb-action-notification-close"
                        onClick={() => setItems((previous) => previous.filter((value) => value.popupId !== item.popupId))}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default NotificationPopup;
