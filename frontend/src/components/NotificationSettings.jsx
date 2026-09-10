import { useState } from "react";
import { toast } from "../utils/notifications";

import { useAuth } from "../context/AuthContext";
import { updateNotificationPreferences } from "../services/settingsService";

function NotificationSettings() {
    const { user, setUser } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleToggle = async (field) => {
        setSaving(true);
        try {
            const payload = { [field]: !user[field] };
            const updatedUser = await updateNotificationPreferences(payload);
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch {
            toast.error("Could not update notification preference.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card shadow-sm p-3 mb-3">
            <h5>Notifications</h5>

            <div className="form-check">
                <input
                    type="checkbox"
                    className="form-check-input"
                    checked={Boolean(user?.email_notifications_enabled)}
                    disabled={saving}
                    onChange={() => handleToggle("email_notifications_enabled")}
                />
                <label className="form-check-label">Email Notifications</label>
            </div>

            <div className="form-check mt-2">
                <input
                    type="checkbox"
                    className="form-check-input"
                    checked={Boolean(user?.app_notifications_enabled)}
                    disabled={saving}
                    onChange={() => handleToggle("app_notifications_enabled")}
                />
                <label className="form-check-label">In-App Notifications</label>
            </div>
        </div>
    );
}

export default NotificationSettings;
