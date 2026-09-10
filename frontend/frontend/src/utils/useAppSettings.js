import { useEffect, useState } from "react";
import { getAppSettings } from "./settings";

export function useAppSettings() {
    const [settings, setSettings] = useState(getAppSettings);

    useEffect(() => {
        const applyTheme = (next) => {
            document.body.classList.toggle("dark-mode", Boolean(next?.darkMode));
        };

        const initial = getAppSettings();
        setSettings(initial);
        applyTheme(initial);

        const handler = (event) => {
            const next = event.detail || getAppSettings();
            setSettings(next);
            applyTheme(next);
        };

        window.addEventListener("bb:settings-changed", handler);
        return () => window.removeEventListener("bb:settings-changed", handler);
    }, []);

    return settings;
}
