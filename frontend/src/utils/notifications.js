/*
 * BudgetBuddy's single in-app notification gateway.
 *
 * Existing pages can keep using:
 *   toast.success(...)
 *   toast.error(...)
 *   toast.warning(...)
 *   toast.info(...)
 *
 * They are routed to the same animated on-screen notification UI.
 */

const emit = (type, message) => {
    window.dispatchEvent(
        new CustomEvent("bb:toast", {
            detail: {
                type,
                message: String(message || "Action completed."),
            },
        })
    );
};

export const toast = {
    success: (message) => emit("success", message),
    error: (message) => emit("error", message),
    warning: (message) => emit("warning", message),
    info: (message) => emit("info", message),
};

// Kept as a compatibility component so existing pages do not need to be
// rewritten just to remove their old ToastContainer imports.
export function ToastContainer() {
    return null;
}
