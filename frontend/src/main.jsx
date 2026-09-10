import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";

import "./styles/index.css";
import "./styles/global.css";
import "./styles/ui-enhancements.css";
import "./styles/sidebar.css";
import "./styles/navbar.css";
import "./styles/notificationPopup.css";
import "./styles/dark-mode.css";

import App from "./App";
import { getAppSettings } from "./utils/settings";
import { AuthProvider } from "./context/AuthContext";

const initialSettings = getAppSettings();
document.body.classList.toggle("dark-mode", Boolean(initialSettings.darkMode));

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
