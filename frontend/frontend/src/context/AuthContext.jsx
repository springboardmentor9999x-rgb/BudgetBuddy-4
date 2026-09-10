import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    getCurrentUserFromApi,
    loginUser as loginRequest,
    logoutUser as logoutRequest,
    clearAuthStorage,
} from "../services/authService";

const AuthContext = createContext(null);

// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
    // -------------------------------------------------------
    // INITIAL USER
    // -------------------------------------------------------

    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");

            return storedUser
                ? JSON.parse(storedUser)
                : null;
        } catch {
            return null;
        }
    });

    // -------------------------------------------------------
    // INITIAL TOKEN
    // -------------------------------------------------------

    const [token, setToken] = useState(
        () => localStorage.getItem("token") || null
    );

    const [loading, setLoading] = useState(true);

    // =======================================================
    // RESTORE SESSION
    // =======================================================

    useEffect(() => {
        let mounted = true;

        const restoreSession = async () => {
            const storedToken =
                localStorage.getItem("token");

            const storedUser =
                localStorage.getItem("user");

            // -------------------------------------------------
            // No token
            // -------------------------------------------------

            if (!storedToken) {
                if (mounted) {
                    setToken(null);
                    setUser(null);
                    setLoading(false);
                }

                return;
            }

            // -------------------------------------------------
            // Token exists
            // -------------------------------------------------

            try {
                const freshUser =
                    await getCurrentUserFromApi();

                if (!mounted) {
                    return;
                }

                setToken(storedToken);
                setUser(freshUser);

                localStorage.setItem(
                    "user",
                    JSON.stringify(freshUser)
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                const status =
                    error?.response?.status;

                // ------------------------------------------------
                // REAL AUTH FAILURE
                // ------------------------------------------------

                if (status === 401) {
                    clearAuthStorage();

                    setToken(null);
                    setUser(null);
                } else {
                    // --------------------------------------------
                    // NETWORK / SERVER / CORS ERROR
                    // --------------------------------------------
                    // Do NOT destroy a valid local session.

                    setToken(storedToken);

                    if (storedUser) {
                        try {
                            setUser(
                                JSON.parse(storedUser)
                            );
                        } catch {
                            setUser(null);
                        }
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        restoreSession();

        return () => {
            mounted = false;
        };
    }, []);

    // =======================================================
    // THEME
    // =======================================================

    useEffect(() => {
        document.body.classList.toggle(
            "dark-mode",
            user?.theme === "dark"
        );
    }, [user]);

    // =======================================================
    // CROSS-TAB SESSION SYNC
    // =======================================================
    // localStorage is shared by every tab on the same origin. If a
    // DIFFERENT tab logs in as a different account (or logs out), it
    // overwrites the same "token"/"user" keys this tab already loaded.
    // Without this listener, this tab's header/UI keeps showing its
    // original user (stale React state) while every subsequent API
    // call - which reads the token fresh from localStorage on every
    // request - silently starts authenticating as whichever account is
    // now active in the other tab. That mismatch is what makes two
    // tabs that each *look* like different logged-in users end up
    // rendering the exact same account's data.
    //
    // The browser only fires "storage" events in OTHER tabs, never in
    // the tab that made the change - so any "token" storage event this
    // tab receives means a different tab changed it. Fix: immediately
    // drop everything this tab has in memory and do a full reload,
    // rather than trying to patch React state in place. A full reload
    // guarantees every page/component (dashboard, bank accounts,
    // notifications, admin tables, etc.) starts over and re-fetches
    // from scratch under whatever session is now actually valid,
    // instead of leaving any stale fetched data rendered from the
    // previous account.
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key !== "token") {
                return;
            }

            window.location.href = "/login";
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, []);

    // =======================================================
    // LOGIN
    // =======================================================

    const login = useCallback(
        async (email, password) => {
            const cleanEmail =
                String(email || "")
                    .trim()
                    .toLowerCase();

            const data = await loginRequest(
                cleanEmail,
                password
            );

            if (data?.payment_required) {
                return data;
            }

            if (!data?.access_token) {
                throw new Error(
                    "Login response is missing an access token."
                );
            }

            // -------------------------------------------------
            // Determine user
            // -------------------------------------------------

            let loggedInUser = data?.user || null;

            // If backend doesn't return user,
            // immediately ask /auth/me.
            if (!loggedInUser) {
                try {
                    loggedInUser =
                        await getCurrentUserFromApi();
                } catch {
                    loggedInUser = null;
                }
            }

            // -------------------------------------------------
            // Save state
            // -------------------------------------------------

            localStorage.setItem(
                "token",
                data.access_token
            );

            localStorage.setItem(
                "loginTime",
                new Date().toISOString()
            );

            if (loggedInUser) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(loggedInUser)
                );
            }

            setToken(data.access_token);
            setUser(loggedInUser);

            return {
                ...data,
                user: loggedInUser,
            };
        },
        []
    );

    // =======================================================
    // LOGOUT
    // =======================================================

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch {
            // Local logout must always happen.
        }

        clearAuthStorage();

        setToken(null);
        setUser(null);
    }, []);

    // =======================================================
    // REFRESH USER
    // =======================================================

    const refreshUser = useCallback(async () => {
        const freshUser =
            await getCurrentUserFromApi();

        setUser(freshUser);

        localStorage.setItem(
            "user",
            JSON.stringify(freshUser)
        );

        return freshUser;
    }, []);

    // =======================================================
    // AUTH STATE
    // =======================================================

    const isAuthenticated =
        Boolean(token && user);

    const isAdmin =
        user?.role === "admin";

    // =======================================================
    // CONTEXT VALUE
    // =======================================================

    const value = {
        user,
        token,
        loading,

        isAuthenticated,
        isAdmin,

        login,
        logout,
        refreshUser,

        setUser,
        setToken,
    };

    // =======================================================
    // PROVIDER
    // =======================================================

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =========================================================
// useAuth
// =========================================================

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    return context;
}

export default AuthContext;