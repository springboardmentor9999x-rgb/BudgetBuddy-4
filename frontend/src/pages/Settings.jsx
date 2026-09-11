import "./../styles/settings.css";

import { useEffect, useState } from "react";

import {
    FaCog,
    FaGlobe,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaDesktop,
    FaLock,
    FaBell,
    FaShieldAlt,
    FaUndo,
    FaSave,
    FaCheckCircle,
    FaUser,
    FaPalette
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useAuth } from "../context/AuthContext";

import {
    saveAppSettings,
    getAppSettings,
    DEFAULT_SETTINGS
} from "../utils/settings";

import {
    updateNotificationPreferences,
    updateTheme
} from "../services/settingsService";

import { toast } from "../utils/notifications";


function Settings() {

    const { user } = useAuth();

    const defaultSettings = {
        language: "English",
        currency: "INR",
        dateFormat: "DD/MM/YYYY",
        showBalances: true,
        automaticLogout: false,
        notifications: true,
        darkMode: false
    };

    const [settings, setSettings] = useState(defaultSettings);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);


    useEffect(() => {

        try {

            const storedSettings = getAppSettings();

            setSettings({
                ...defaultSettings,
                ...storedSettings
            });

        } catch (error) {

            console.error(
                "Unable to load settings:",
                error
            );

        }

    }, []);


    const updateSetting = (key, value) => {

        setSettings((previous) => ({
            ...previous,
            [key]: value
        }));

        setSaved(false);
    };


    const handleSave = async (event) => {

        event.preventDefault();

        setSaving(true);

        try {

            /*
             * Save settings locally first.
             */
            saveAppSettings(settings);


            /*
             * Apply dark mode immediately.
             */
            document.body.classList.toggle(
                "dark-mode",
                Boolean(settings.darkMode)
            );


            /*
             * Sync settings with backend.
             */
            try {

                await Promise.all([
                    updateNotificationPreferences({
                        email_notifications_enabled:
                            settings.notifications,

                        app_notifications_enabled:
                            settings.notifications
                    }),

                    updateTheme(
                        settings.darkMode
                            ? "dark"
                            : "light"
                    )
                ]);


                toast.success(
                    "Settings saved and synced."
                );

            } catch (syncError) {

                console.error(
                    "Settings server sync failed:",
                    syncError
                );

                toast.warning(
                    "Local settings saved. Server sync will retry next time."
                );
            }


            setSaved(true);


            setTimeout(() => {
                setSaved(false);
            }, 3000);


        } catch (error) {

            console.error(
                "Unable to save settings:",
                error
            );

            toast.error(
                "Unable to save settings."
            );

        } finally {

            setSaving(false);

        }
    };


    const handleReset = () => {

        setSettings({
            ...defaultSettings
        });

        setSaved(false);


        saveAppSettings(DEFAULT_SETTINGS);


        /*
         * Reset theme.
         */
        document.body.classList.remove(
            "dark-mode"
        );

        updateTheme("light").catch(() => {});


        /*
         * Reset notifications.
         */
        updateNotificationPreferences({
            email_notifications_enabled: true,
            app_notifications_enabled: true
        }).catch(() => {});


        toast.info(
            "Settings restored to defaults."
        );
    };


    return (

        <div className="bb-settings-layout">

            {/* =====================================================
                SIDEBAR
                ===================================================== */}

            <Sidebar />


            {/* =====================================================
                MAIN SETTINGS CONTENT
                ===================================================== */}

            <div className="bb-settings-main">

                {/* =================================================
                    NAVBAR
                    Kept inside the main content shell so it does
                    not become part of the sidebar area.
                    ================================================= */}

                <div className="bb-settings-navbar">

                    <Navbar />

                </div>


                {/* =================================================
                    SETTINGS PAGE
                    ================================================= */}

                <main className="bb-settings-page">


                    {/* =================================================
                        HERO
                        ================================================= */}

                    <section className="settings-hero">

                        <div className="settings-hero-content">

                            <div className="settings-eyebrow">

                                <FaCog />

                                PREFERENCES

                            </div>


                            <h1>
                                Settings
                            </h1>


                            <p>
                                Customize how BudgetBuddy
                                works for you.
                            </p>

                        </div>


                        {/* HERO ART */}

                        <div className="settings-hero-art">

                            <div className="settings-floating-icon icon-one">

                                <FaBell />

                            </div>


                            <div className="settings-floating-icon icon-two">

                                <FaShieldAlt />

                            </div>


                            <div className="settings-floating-icon icon-three">

                                <FaPalette />

                            </div>


                            <div className="settings-main-icon">

                                <FaCog />

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        SUCCESS MESSAGE
                        ================================================= */}

                    {saved && (

                        <div className="settings-success">

                            <FaCheckCircle />

                            <span>
                                Settings saved successfully.
                            </span>

                        </div>

                    )}


                    {/* =================================================
                        SETTINGS FORM
                        ================================================= */}

                    <form
                        className="settings-form"
                        onSubmit={handleSave}
                    >


                        {/* =================================================
                            REGIONAL PREFERENCES
                            ================================================= */}

                        <section className="settings-card">

                            <div className="settings-card-heading">

                                <div className="settings-heading-icon">

                                    <FaGlobe />

                                </div>


                                <div>

                                    <span>
                                        REGIONAL PREFERENCES
                                    </span>

                                    <h2>
                                        Regional Preferences
                                    </h2>

                                    <p>
                                        Choose your preferred
                                        language, currency and
                                        date format.
                                    </p>

                                </div>

                            </div>


                            <div className="settings-divider" />


                            <div className="settings-options-grid">


                                {/* LANGUAGE */}

                                <div className="settings-field">

                                    <label>

                                        <FaGlobe />

                                        Language

                                    </label>


                                    <select
                                        value={settings.language}
                                        onChange={(e) =>
                                            updateSetting(
                                                "language",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="English">
                                            English
                                        </option>

                                        <option value="Tamil">
                                            Tamil
                                        </option>

                                        <option value="Hindi">
                                            Hindi
                                        </option>

                                    </select>

                                </div>


                                {/* CURRENCY */}

                                <div className="settings-field">

                                    <label>

                                        <FaMoneyBillWave />

                                        Currency

                                    </label>


                                    <select
                                        value={settings.currency}
                                        onChange={(e) =>
                                            updateSetting(
                                                "currency",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="INR">
                                            ₹ INR — Indian Rupee
                                        </option>

                                        <option value="USD">
                                            $ USD — US Dollar
                                        </option>

                                        <option value="EUR">
                                            € EUR — Euro
                                        </option>

                                        <option value="GBP">
                                            £ GBP — British Pound
                                        </option>

                                    </select>

                                </div>


                                {/* DATE FORMAT */}

                                <div className="settings-field">

                                    <label>

                                        <FaCalendarAlt />

                                        Date Format

                                    </label>


                                    <select
                                        value={settings.dateFormat}
                                        onChange={(e) =>
                                            updateSetting(
                                                "dateFormat",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="DD/MM/YYYY">
                                            DD/MM/YYYY
                                        </option>

                                        <option value="MM/DD/YYYY">
                                            MM/DD/YYYY
                                        </option>

                                        <option value="YYYY-MM-DD">
                                            YYYY-MM-DD
                                        </option>

                                    </select>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            DASHBOARD PREFERENCES
                            ================================================= */}

                        <section className="settings-card">

                            <div className="settings-card-heading">

                                <div className="settings-heading-icon purple">

                                    <FaDesktop />

                                </div>


                                <div>

                                    <span>
                                        DASHBOARD PREFERENCES
                                    </span>

                                    <h2>
                                        Dashboard Preferences
                                    </h2>

                                    <p>
                                        Control how financial
                                        information appears
                                        throughout the application.
                                    </p>

                                </div>

                            </div>


                            <div className="settings-divider" />


                            {/* SHOW BALANCES */}

                            <div className="settings-toggle-row">

                                <div className="settings-toggle-icon">

                                    <FaMoneyBillWave />

                                </div>


                                <div className="settings-toggle-text">

                                    <strong>
                                        Show account balances
                                    </strong>

                                    <span>
                                        Display your current bank
                                        balances on the dashboard.
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className={`settings-switch ${
                                        settings.showBalances
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        updateSetting(
                                            "showBalances",
                                            !settings.showBalances
                                        )
                                    }
                                    aria-label="Toggle account balances"
                                    aria-pressed={
                                        settings.showBalances
                                    }
                                >

                                    <span />

                                </button>

                            </div>


                            {/* AUTOMATIC LOGOUT */}

                            <div className="settings-toggle-row">

                                <div className="settings-toggle-icon">

                                    <FaLock />

                                </div>


                                <div className="settings-toggle-text">

                                    <strong>
                                        Automatic logout
                                    </strong>

                                    <span>
                                        Automatically sign out
                                        after a period of inactivity.
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className={`settings-switch ${
                                        settings.automaticLogout
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        updateSetting(
                                            "automaticLogout",
                                            !settings.automaticLogout
                                        )
                                    }
                                    aria-label="Toggle automatic logout"
                                    aria-pressed={
                                        settings.automaticLogout
                                    }
                                >

                                    <span />

                                </button>

                            </div>


                            {/* DARK MODE */}

                            <div className="settings-toggle-row">

                                <div className="settings-toggle-icon">

                                    <FaPalette />

                                </div>


                                <div className="settings-toggle-text">

                                    <strong>
                                        Dark mode
                                    </strong>

                                    <span>
                                        Use a low-light interface
                                        across BudgetBuddy.
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className={`settings-switch ${
                                        settings.darkMode
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        updateSetting(
                                            "darkMode",
                                            !settings.darkMode
                                        )
                                    }
                                    aria-label="Toggle dark mode"
                                    aria-pressed={
                                        settings.darkMode
                                    }
                                >

                                    <span />

                                </button>

                            </div>


                            {/* NOTIFICATIONS */}

                            <div className="settings-toggle-row">

                                <div className="settings-toggle-icon">

                                    <FaBell />

                                </div>


                                <div className="settings-toggle-text">

                                    <strong>
                                        Notifications
                                    </strong>

                                    <span>
                                        Receive important BudgetBuddy
                                        financial notifications.
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className={`settings-switch ${
                                        settings.notifications
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        updateSetting(
                                            "notifications",
                                            !settings.notifications
                                        )
                                    }
                                    aria-label="Toggle notifications"
                                    aria-pressed={
                                        settings.notifications
                                    }
                                >

                                    <span />

                                </button>

                            </div>

                        </section>


                        {/* =================================================
                            ACCOUNT INFORMATION
                            ================================================= */}

                        <section className="settings-card">

                            <div className="settings-card-heading">

                                <div className="settings-heading-icon blue">

                                    <FaUser />

                                </div>


                                <div>

                                    <span>
                                        ACCOUNT
                                    </span>

                                    <h2>
                                        Account Information
                                    </h2>

                                    <p>
                                        Your current BudgetBuddy
                                        account information.
                                    </p>

                                </div>

                            </div>


                            <div className="settings-divider" />


                            <div className="settings-account-grid">


                                {/* ACCOUNT NAME */}

                                <div className="settings-account-item">

                                    <span>
                                        ACCOUNT NAME
                                    </span>

                                    <strong>
                                        {user?.full_name || "User"}
                                    </strong>

                                </div>


                                {/* EMAIL */}

                                <div className="settings-account-item">

                                    <span>
                                        EMAIL
                                    </span>

                                    <strong>
                                        {user?.email || "Not available"}
                                    </strong>

                                </div>


                                {/* ACCOUNT STATUS */}

                                <div className="settings-account-item">

                                    <span>
                                        ACCOUNT STATUS
                                    </span>

                                    <strong className="account-active">
                                        Active
                                    </strong>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            ACTION BUTTONS
                            ================================================= */}

                        <div className="settings-actions">


                            {/* RESET */}

                            <button
                                type="button"
                                className="settings-reset-btn"
                                onClick={handleReset}
                            >

                                <FaUndo />

                                <span>
                                    Reset
                                </span>

                            </button>


                            {/* SAVE */}

                            <button
                                type="submit"
                                className="settings-save-btn"
                                disabled={saving}
                            >

                                {saving ? (

                                    <>

                                        <span className="settings-spinner" />

                                        Saving...

                                    </>

                                ) : (

                                    <>

                                        <FaSave />

                                        Save Changes

                                    </>

                                )}

                            </button>

                        </div>

                    </form>


                    {/* =================================================
                        FOOTER
                        ================================================= */}

                    <Footer />

                </main>

            </div>

        </div>
    );
}


export default Settings;
