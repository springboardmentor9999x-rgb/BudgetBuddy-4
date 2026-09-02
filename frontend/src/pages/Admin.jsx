import { useEffect, useState } from "react";

import api from "../api/axios";

import ProtectedLayout from "../components/ProtectedLayout";


function Admin() {

    const [users, setUsers] = useState([]);

    const [subscriptionRequests, setSubscriptionRequests] = useState([]);

    const [loading, setLoading] = useState(true);

    const [requestsLoading, setRequestsLoading] = useState(true);

    const [updatingUserId, setUpdatingUserId] = useState(null);

    const [updatingRequestId, setUpdatingRequestId] = useState(null);


    // =========================================================
    // Load Users
    // =========================================================

    const loadUsers = async () => {

        try {

            setLoading(true);

            const response =
                await api.get("/admin/users");

            setUsers(response.data || []);

        } catch (error) {

            console.error(
                "Failed to load users:",
                error
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // Load Subscription Requests
    // =========================================================

    const loadSubscriptionRequests = async () => {

        try {

            setRequestsLoading(true);

            const response =
                await api.get(
                    "/admin/subscription-requests"
                );

            setSubscriptionRequests(
                response.data || []
            );

        } catch (error) {

            console.error(
                "Failed to load subscription requests:",
                error
            );

            setSubscriptionRequests([]);

        } finally {

            setRequestsLoading(false);

        }
    };


    // =========================================================
    // Load All Admin Data
    // =========================================================

    const loadAdminData = async () => {

        await Promise.all([
            loadUsers(),
            loadSubscriptionRequests(),
        ]);

    };


    // =========================================================
    // Initial Load
    // =========================================================

    useEffect(() => {

        loadAdminData();

    }, []);


    // =========================================================
    // Activate / Deactivate User
    // =========================================================

    const handleStatusChange = async (user) => {

        try {

            setUpdatingUserId(user.id);

            const endpoint = user.is_active
                ? `/admin/users/${user.id}/deactivate`
                : `/admin/users/${user.id}/activate`;


            await api.patch(endpoint);

            await loadUsers();

        } catch (error) {

            console.error(
                "Failed to update user status:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Failed to update user status."
            );

        } finally {

            setUpdatingUserId(null);

        }
    };


    // =========================================================
    // Change User Role
    // =========================================================

    const handleRoleChange = async (
        user,
        newRole
    ) => {

        if (user.role === newRole) {

            return;

        }


        try {

            setUpdatingUserId(user.id);


            await api.patch(
                `/admin/users/${user.id}/role`,

                null,

                {
                    params: {
                        role: newRole,
                    },
                }
            );


            await loadUsers();

        } catch (error) {

            console.error(
                "Failed to update user role:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Failed to update user role."
            );

        } finally {

            setUpdatingUserId(null);

        }
    };


    // =========================================================
    // REMOVE PREMIUM SUBSCRIPTION
    // =========================================================

    const handleRemovePremium = async (user) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to remove Premium subscription from ${user.email}?\n\nThis will change the user back to a Student account and remove Premium access.`
            );


        if (!confirmed) {

            return;

        }


        try {

            setUpdatingUserId(user.id);


            await api.patch(
                `/admin/users/${user.id}/remove-premium`
            );


            alert(
                "Premium subscription removed successfully. The user is now a Student."
            );


            // Refresh users and subscription requests
            await loadAdminData();

        } catch (error) {

            console.error(
                "Failed to remove Premium subscription:",
                error
            );


            alert(
                error.response?.data?.detail ||
                "Failed to remove Premium subscription."
            );

        } finally {

            setUpdatingUserId(null);

        }
    };


    // =========================================================
    // Approve Premium Request
    // =========================================================

    const handleApproveRequest = async (
        requestId
    ) => {

        try {

            setUpdatingRequestId(requestId);


            await api.patch(
                `/admin/subscription-requests/${requestId}/approve`
            );


            alert(
                "Premium subscription approved successfully."
            );


            // Refresh users and subscription requests
            await loadAdminData();

        } catch (error) {

            console.error(
                "Failed to approve subscription request:",
                error
            );


            alert(
                error.response?.data?.detail ||
                "Failed to approve subscription request."
            );

        } finally {

            setUpdatingRequestId(null);

        }
    };


    // =========================================================
    // Reject Premium Request
    // =========================================================

    const handleRejectRequest = async (
        requestId
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to reject this Premium request?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setUpdatingRequestId(requestId);


            await api.patch(
                `/admin/subscription-requests/${requestId}/reject`
            );


            alert(
                "Premium subscription request rejected."
            );


            // Refresh users and subscription requests
            await loadAdminData();

        } catch (error) {

            console.error(
                "Failed to reject subscription request:",
                error
            );


            alert(
                error.response?.data?.detail ||
                "Failed to reject subscription request."
            );

        } finally {

            setUpdatingRequestId(null);

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
                        Admin Panel
                    </h1>

                    <p style={styles.loadingText}>
                        Loading admin panel...
                    </p>

                </div>

            </ProtectedLayout>

        );

    }


    // =========================================================
    // Pending Requests
    // =========================================================

    const pendingRequests =
        subscriptionRequests.filter(
            (request) =>
                request.status?.toLowerCase() === "pending"
        );


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
                            Admin Panel
                        </h1>

                        <p style={styles.subtitle}>
                            Manage BudgetBuddy users, subscriptions,
                            roles, and account status.
                        </p>

                    </div>


                    <button
                        type="button"
                        style={styles.refreshButton}
                        onClick={loadAdminData}
                    >
                        Refresh
                    </button>

                </div>


                {/* =================================================
                    Summary Cards
                ================================================= */}

                <div style={styles.summaryContainer}>


                    {/* Total Users */}

                    <div style={styles.summaryCard}>

                        <div style={styles.summaryLabel}>
                            Total Users
                        </div>

                        <div style={styles.summaryValue}>
                            {users.length}
                        </div>

                    </div>


                    {/* Active Users */}

                    <div style={styles.summaryCard}>

                        <div style={styles.summaryLabel}>
                            Active Users
                        </div>

                        <div style={styles.summaryValue}>

                            {
                                users.filter(
                                    (user) =>
                                        user.is_active
                                ).length
                            }

                        </div>

                    </div>


                    {/* Premium Users */}

                    <div style={styles.summaryCard}>

                        <div style={styles.summaryLabel}>
                            Premium Users
                        </div>

                        <div style={styles.summaryValue}>

                            {
                                users.filter(
                                    (user) =>
                                        user.role?.toLowerCase() ===
                                        "premium"
                                ).length
                            }

                        </div>

                    </div>


                    {/* Pending Requests */}

                    <div
                        style={{
                            ...styles.summaryCard,
                            ...styles.pendingSummaryCard,
                        }}
                    >

                        <div style={styles.summaryLabel}>
                            Pending Premium Requests
                        </div>

                        <div style={styles.pendingSummaryValue}>
                            {pendingRequests.length}
                        </div>

                    </div>


                    {/* Admins */}

                    <div style={styles.summaryCard}>

                        <div style={styles.summaryLabel}>
                            Admins
                        </div>

                        <div style={styles.summaryValue}>

                            {
                                users.filter(
                                    (user) =>
                                        user.role?.toLowerCase() ===
                                        "admin"
                                ).length
                            }

                        </div>

                    </div>

                </div>


                {/* =================================================
                    PREMIUM SUBSCRIPTION REQUESTS
                ================================================= */}

                <div style={styles.requestContainer}>


                    {/* Header */}

                    <div style={styles.requestHeader}>

                        <div>

                            <h2 style={styles.requestTitle}>
                                💎 Premium Subscription Requests
                            </h2>

                            <p style={styles.requestSubtitle}>
                                Review and approve users who requested
                                Premium access.
                            </p>

                        </div>


                        <span
                            style={
                                pendingRequests.length > 0
                                    ? styles.pendingBadge
                                    : styles.noPendingBadge
                            }
                        >
                            {pendingRequests.length} Pending
                        </span>

                    </div>


                    {/* Request Content */}

                    {requestsLoading ? (

                        <div style={styles.requestLoading}>
                            Loading subscription requests...
                        </div>

                    ) : subscriptionRequests.length === 0 ? (

                        <div style={styles.emptyRequests}>

                            <div style={styles.emptyIcon}>
                                💎
                            </div>

                            <h3 style={styles.emptyTitle}>
                                No subscription requests
                            </h3>

                            <p style={styles.emptyText}>
                                Premium subscription requests will
                                appear here when users request access.
                            </p>

                        </div>

                    ) : (

                        <div style={styles.requestTableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            Request ID
                                        </th>

                                        <th style={styles.th}>
                                            User
                                        </th>

                                        <th style={styles.th}>
                                            Plan
                                        </th>

                                        <th style={styles.th}>
                                            Status
                                        </th>

                                        <th style={styles.th}>
                                            Requested
                                        </th>

                                        <th style={styles.th}>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {subscriptionRequests.map(
                                        (request) => {

                                            const status =
                                                request.status?.toLowerCase();

                                            const isUpdating =
                                                updatingRequestId ===
                                                request.id;


                                            return (

                                                <tr
                                                    key={request.id}
                                                >

                                                    {/* Request ID */}

                                                    <td style={styles.td}>

                                                        <strong>
                                                            #{request.id}
                                                        </strong>

                                                    </td>


                                                    {/* User */}

                                                    <td style={styles.td}>

                                                        <div
                                                            style={
                                                                styles.userCell
                                                            }
                                                        >

                                                            <strong>
                                                                {
                                                                    request.user?.full_name ||
                                                                    request.user?.email ||
                                                                    `User #${request.user_id}`
                                                                }
                                                            </strong>

                                                            {request.user?.email && (
                                                                <span
                                                                    style={
                                                                        styles.emailText
                                                                    }
                                                                >
                                                                    {
                                                                        request.user.email
                                                                    }
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>


                                                    {/* Plan */}

                                                    <td style={styles.td}>

                                                        <span
                                                            style={
                                                                styles.premiumPlan
                                                            }
                                                        >
                                                            💎 Premium
                                                        </span>

                                                    </td>


                                                    {/* Status */}

                                                    <td style={styles.td}>

                                                        <span
                                                            style={
                                                                status ===
                                                                    "pending"
                                                                    ? styles.pendingStatus
                                                                    : status ===
                                                                        "approved"
                                                                        ? styles.approvedStatus
                                                                        : styles.rejectedStatus
                                                            }
                                                        >
                                                            {
                                                                request.status ||
                                                                "-"
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* Date */}

                                                    <td style={styles.td}>

                                                        {
                                                            request.created_at
                                                                ? new Date(
                                                                    request.created_at
                                                                ).toLocaleString()
                                                                : "-"
                                                        }

                                                    </td>


                                                    {/* Action */}

                                                    <td style={styles.td}>

                                                        {status ===
                                                            "pending" ? (

                                                            <div
                                                                style={
                                                                    styles.actionGroup
                                                                }
                                                            >

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleApproveRequest(
                                                                            request.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    style={
                                                                        isUpdating
                                                                            ? styles.disabledButton
                                                                            : styles.approveButton
                                                                    }
                                                                >

                                                                    {isUpdating
                                                                        ? "Processing..."
                                                                        : "✓ Approve"}

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleRejectRequest(
                                                                            request.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isUpdating
                                                                    }
                                                                    style={
                                                                        isUpdating
                                                                            ? styles.disabledButton
                                                                            : styles.rejectButton
                                                                    }
                                                                >

                                                                    ✕ Reject

                                                                </button>

                                                            </div>

                                                        ) : (

                                                            <span
                                                                style={
                                                                    styles.completedText
                                                                }
                                                            >
                                                                Processed
                                                            </span>

                                                        )}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>


                {/* =================================================
                    USER MANAGEMENT
                ================================================= */}

                <div style={styles.tableContainer}>

                    <div style={styles.tableHeader}>

                        <div>

                            <h2 style={styles.tableTitle}>
                                User Management
                            </h2>

                            <p style={styles.tableSubtitle}>
                                Manage user roles, Premium subscriptions,
                                and account status.
                            </p>

                        </div>


                        <span style={styles.userCount}>
                            {users.length} users
                        </span>

                    </div>


                    <div style={styles.tableWrapper}>

                        <table style={styles.table}>

                            <thead>

                                <tr>

                                    <th style={styles.th}>
                                        ID
                                    </th>

                                    <th style={styles.th}>
                                        Email
                                    </th>

                                    <th style={styles.th}>
                                        Role
                                    </th>

                                    <th style={styles.th}>
                                        Status
                                    </th>

                                    <th style={styles.th}>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {users.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={styles.emptyCell}
                                        >
                                            No users found.
                                        </td>

                                    </tr>

                                ) : (

                                    users.map((user) => {

                                        /*
                                         * Admin self-protection.
                                         *
                                         * If your /admin/users endpoint
                                         * returns the current admin as
                                         * well, this remains false because
                                         * we don't have the current admin
                                         * ID here.
                                         *
                                         * Backend still protects admin
                                         * operations.
                                         */

                                        const isCurrentAdmin =
                                            false;

                                        const isPremium =
                                            user.role?.toLowerCase() ===
                                            "premium";

                                        const isUpdating =
                                            updatingUserId ===
                                            user.id;


                                        return (

                                            <tr key={user.id}>


                                                {/* ID */}

                                                <td style={styles.td}>
                                                    {user.id}
                                                </td>


                                                {/* Email */}

                                                <td style={styles.td}>
                                                    {user.email}
                                                </td>


                                                {/* Role */}

                                                <td style={styles.td}>

                                                    <select
                                                        value={
                                                            user.role
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleRoleChange(
                                                                user,
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        disabled={
                                                            isUpdating ||
                                                            isCurrentAdmin ||
                                                            isPremium
                                                        }
                                                        style={
                                                            styles.roleSelect
                                                        }
                                                    >

                                                        <option value="student">
                                                            Student
                                                        </option>

                                                        <option value="premium">
                                                            Premium
                                                        </option>

                                                        <option value="admin">
                                                            Admin
                                                        </option>

                                                    </select>

                                                </td>


                                                {/* Status */}

                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            user.is_active
                                                                ? styles.activeStatus
                                                                : styles.inactiveStatus
                                                        }
                                                    >
                                                        {
                                                            user.is_active
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                    </span>

                                                </td>


                                                {/* Action */}

                                                <td style={styles.td}>

                                                    <div
                                                        style={
                                                            styles.userActionGroup
                                                        }
                                                    >


                                                        {/* =================================================
                                                            REMOVE PREMIUM
                                                        ================================================= */}

                                                        {isPremium && (

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemovePremium(
                                                                        user
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating
                                                                }
                                                                style={
                                                                    isUpdating
                                                                        ? styles.disabledButton
                                                                        : styles.removePremiumButton
                                                                }
                                                            >

                                                                {isUpdating
                                                                    ? "Removing..."
                                                                    : "Remove Premium"}

                                                            </button>

                                                        )}


                                                        {/* =================================================
                                                            ACTIVATE / DEACTIVATE
                                                        ================================================= */}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    user
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating
                                                            }
                                                            style={
                                                                isUpdating
                                                                    ? styles.disabledButton
                                                                    : user.is_active
                                                                        ? styles.deactivateButton
                                                                        : styles.activateButton
                                                            }
                                                        >

                                                            {isUpdating
                                                                ? "Updating..."
                                                                : user.is_active
                                                                    ? "Deactivate"
                                                                    : "Activate"}

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    })

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>


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
        marginBottom: 0,
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


    loadingText: {
        color: "#6b7280",
        fontSize: "16px",
    },


    // =========================================================
    // Summary
    // =========================================================

    summaryContainer: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "18px",
        marginBottom: "30px",
    },


    summaryCard: {
        background: "white",
        padding: "22px",
        borderRadius: "12px",
        boxShadow:
            "0 4px 12px rgba(0,0,0,0.06)",
    },


    pendingSummaryCard: {
        border:
            "1px solid #fbbf24",
        background:
            "#fffbeb",
    },


    summaryLabel: {
        color: "#6b7280",
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "8px",
    },


    summaryValue: {
        color: "#1f2937",
        fontSize: "28px",
        fontWeight: "700",
    },


    pendingSummaryValue: {
        color: "#d97706",
        fontSize: "28px",
        fontWeight: "800",
    },


    // =========================================================
    // Subscription Requests
    // =========================================================

    requestContainer: {
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "30px",
        boxShadow:
            "0 5px 18px rgba(0,0,0,0.08)",
        border:
            "1px solid #e5e7eb",
    },


    requestHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px",
        borderBottom:
            "1px solid #e5e7eb",
        gap: "20px",
    },


    requestTitle: {
        margin: 0,
        fontSize: "22px",
        fontWeight: "800",
        color: "#111827",
    },


    requestSubtitle: {
        margin: "7px 0 0",
        color: "#6b7280",
        fontSize: "14px",
    },


    pendingBadge: {
        background: "#fef3c7",
        color: "#92400e",
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "700",
        whiteSpace: "nowrap",
    },


    noPendingBadge: {
        background: "#f3f4f6",
        color: "#6b7280",
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "700",
        whiteSpace: "nowrap",
    },


    requestLoading: {
        padding: "45px",
        textAlign: "center",
        color: "#6b7280",
    },


    emptyRequests: {
        padding: "50px 25px",
        textAlign: "center",
    },


    emptyIcon: {
        fontSize: "42px",
        marginBottom: "10px",
    },


    emptyTitle: {
        margin: 0,
        color: "#374151",
        fontSize: "18px",
    },


    emptyText: {
        color: "#6b7280",
        fontSize: "14px",
        marginTop: "8px",
    },


    requestTableWrapper: {
        width: "100%",
        overflowX: "auto",
    },


    // =========================================================
    // Table
    // =========================================================

    tableContainer: {
        background: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow:
            "0 4px 12px rgba(0,0,0,0.08)",
    },


    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        borderBottom:
            "1px solid #e5e7eb",
    },


    tableTitle: {
        margin: 0,
        fontSize: "20px",
        fontWeight: "700",
        color: "#1f2937",
    },


    tableSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },


    userCount: {
        color: "#6b7280",
        fontSize: "14px",
    },


    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },


    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "900px",
    },


    th: {
        textAlign: "left",
        padding: "16px",
        background: "#f3f4f6",
        color: "#374151",
        fontWeight: "700",
        fontSize: "14px",
    },


    td: {
        padding: "16px",
        borderTop:
            "1px solid #e5e7eb",
        color: "#374151",
        fontSize: "14px",
    },


    emptyCell: {
        padding: "40px",
        textAlign: "center",
        color: "#6b7280",
    },


    // =========================================================
    // User Cell
    // =========================================================

    userCell: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },


    emailText: {
        color: "#6b7280",
        fontSize: "12px",
    },


    // =========================================================
    // Premium
    // =========================================================

    premiumPlan: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontWeight: "700",
        fontSize: "13px",
    },


    pendingStatus: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontWeight: "700",
        fontSize: "13px",
        textTransform: "capitalize",
    },


    approvedStatus: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontWeight: "700",
        fontSize: "13px",
        textTransform: "capitalize",
    },


    rejectedStatus: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#fee2e2",
        color: "#991b1b",
        fontWeight: "700",
        fontSize: "13px",
        textTransform: "capitalize",
    },


    // =========================================================
    // Request Actions
    // =========================================================

    actionGroup: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },


    approveButton: {
        padding: "8px 13px",
        border: "none",
        borderRadius: "7px",
        background: "#16a34a",
        color: "white",
        cursor: "pointer",
        fontWeight: "700",
    },


    rejectButton: {
        padding: "8px 13px",
        border: "none",
        borderRadius: "7px",
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
        fontWeight: "700",
    },


    disabledButton: {
        padding: "8px 13px",
        border: "none",
        borderRadius: "7px",
        background: "#9ca3af",
        color: "white",
        cursor: "not-allowed",
        fontWeight: "700",
    },


    completedText: {
        color: "#9ca3af",
        fontSize: "13px",
        fontWeight: "600",
    },


    // =========================================================
    // Role
    // =========================================================

    roleSelect: {
        padding: "8px 10px",
        border:
            "1px solid #d1d5db",
        borderRadius: "6px",
        background: "white",
        color: "#374151",
        fontWeight: "600",
        cursor: "pointer",
    },


    // =========================================================
    // Status
    // =========================================================

    activeStatus: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontWeight: "600",
        fontSize: "13px",
    },


    inactiveStatus: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "20px",
        background: "#fee2e2",
        color: "#991b1b",
        fontWeight: "600",
        fontSize: "13px",
    },


    // =========================================================
    // User Action Group
    // =========================================================

    userActionGroup: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        alignItems: "center",
    },


    // =========================================================
    // Remove Premium Button
    // =========================================================

    removePremiumButton: {
        padding: "8px 14px",
        border: "none",
        borderRadius: "6px",
        background: "#f59e0b",
        color: "white",
        cursor: "pointer",
        fontWeight: "700",
    },


    // =========================================================
    // User Buttons
    // =========================================================

    activateButton: {
        padding: "8px 14px",
        border: "none",
        borderRadius: "6px",
        background: "#16a34a",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
    },


    deactivateButton: {
        padding: "8px 14px",
        border: "none",
        borderRadius: "6px",
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
    },

};


export default Admin;