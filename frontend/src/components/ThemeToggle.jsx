import { useState } from "react";
import { toast } from "../utils/notifications";

import { useAuth } from "../context/AuthContext";
import { updateTheme } from "../services/settingsService";

function ThemeToggle() {
    const { user, setUser } = useAuth();
    const [saving, setSaving] = useState(false);

    const dark = user?.theme === "dark";

    const toggleTheme = async () => {
        const nextTheme = dark ? "light" : "dark";
        setSaving(true);

        try {
            const updatedUser = await updateTheme(nextTheme);
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            document.body.classList.toggle("dark-mode", nextTheme === "dark");
            toast.success(`Switched to ${nextTheme} mode`);
        } catch {
            toast.error("Could not update theme. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card shadow-sm p-3 mb-3">
            <h5>Theme</h5>
            <button
                className="btn btn-primary"
                onClick={toggleTheme}
                disabled={saving}
            >
                {dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
        </div>
    );
}

export default ThemeToggle;
