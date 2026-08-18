import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./theme.css";
import "./index.css";
import "./styles/ProductUI.css";

function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme || theme === "system") {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

// On load, prefer explicit saved theme, otherwise check stored settings
const savedTheme = localStorage.getItem('budgetbuddy-theme');
if (savedTheme) applyTheme(savedTheme);
else {
  try {
    const stored = JSON.parse(localStorage.getItem('budgetbuddy-settings') || '{}');
    applyTheme(stored.theme || 'system');
  } catch {
    applyTheme('system');
  }
}

// Respond to other tabs updating the theme
window.addEventListener('storage', (e) => {
  if (e.key === 'budgetbuddy-theme' || e.key === 'budgetbuddy-settings') {
    const theme = localStorage.getItem('budgetbuddy-theme');
    if (theme) applyTheme(theme);
    else {
      try {
        const stored = JSON.parse(localStorage.getItem('budgetbuddy-settings') || '{}');
        applyTheme(stored.theme || 'system');
      } catch { applyTheme('system'); }
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
