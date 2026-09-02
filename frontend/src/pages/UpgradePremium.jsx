import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaCrown,
    FaCheck,
    FaClock,
    FaTimesCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";


function UpgradePremium() {

    const { user } = useAuth();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [checking, setChecking] = useState(true);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const [requestStatus, setRequestStatus] = useState(null);


    // =========================================================
    // Check Existing Subscription Request
    // =========================================================

    const checkRequestStatus = async () => {

        try {

            setChecking(true);

            setMessage("");

            setError("");

            const token =
                localStorage.getItem("token");


            if (!token) {

                setChecking(false);

                return;
            }


            const response =
                await api.get(
                    "/subscription/my-request",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            if (response.data?.has_request) {

                setRequestStatus(
                    response.data.status
                );

            } else {

                setRequestStatus(null);

            }

        } catch (err) {

            console.error(
                "Failed to check subscription request:",
                err
            );

            setRequestStatus(null);

        } finally {

            setChecking(false);

        }
    };


    // =========================================================
    // Load Request Status
    // =========================================================

    useEffect(() => {

        checkRequestStatus();

    }, []);


    // =========================================================
    // Request Premium
    // =========================================================

    const handleRequestPremium = async () => {

        try {

            setLoading(true);

            setMessage("");

            setError("");


            const token =
                localStorage.getItem("token");


            if (!token) {

                setError(
                    "Please login again to request Premium."
                );

                return;
            }


            const response =
                await api.post(
                    "/subscription/request",
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            setMessage(
                response.data?.message ||
                "Premium request sent successfully."
            );


            setRequestStatus(
                response.data?.status ||
                "pending"
            );

        } catch (err) {

            console.error(
                "Premium request error:",
                err
            );


            const detail =
                err?.response?.data?.detail;


            if (
                err?.response?.status === 400 &&
                detail?.toLowerCase()?.includes("pending")
            ) {

                setRequestStatus("pending");

            }


            setError(
                detail ||
                "Failed to send Premium request."
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // Already Premium
    // =========================================================

    if (
        user?.role?.toLowerCase() === "premium"
    ) {

        return (

            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">


                    {/* =================================================
                        Premium Icon
                    ================================================= */}

                    <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">

                        <FaCrown className="text-yellow-500 text-4xl" />

                    </div>


                    {/* =================================================
                        Title
                    ================================================= */}

                    <h1 className="text-3xl font-bold text-gray-800 mt-6">

                        Premium Access

                    </h1>


                    {/* =================================================
                        Description
                    ================================================= */}

                    <p className="text-gray-500 mt-3">

                        Your Premium features are already unlocked.

                    </p>


                    {/* =================================================
                        Success Message
                    ================================================= */}

                    {message && (

                        <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">

                            <div className="flex items-center justify-center gap-3">

                                <FaCheck />

                                <span className="font-medium">

                                    {message}

                                </span>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        Error Message
                    ================================================= */}

                    {error && (

                        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">

                            <div className="flex items-center justify-center gap-3">

                                <FaTimesCircle />

                                <span>

                                    {error}

                                </span>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        Dashboard Button
                    ================================================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                    >

                        Go to Dashboard

                    </button>

                </div>

            </div>

        );
    }


    // =========================================================
    // Admin
    // =========================================================

    if (
        user?.role?.toLowerCase() === "admin"
    ) {

        return (

            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">


                    {/* =================================================
                        Admin Icon
                    ================================================= */}

                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">

                        <FaCrown className="text-blue-600 text-4xl" />

                    </div>


                    {/* =================================================
                        Title
                    ================================================= */}

                    <h1 className="text-3xl font-bold text-gray-800 mt-6">

                        Admin Access

                    </h1>


                    {/* =================================================
                        Description
                    ================================================= */}

                    <p className="text-gray-500 mt-3">

                        Administrator accounts already have access
                        to all application features.

                    </p>


                    {/* =================================================
                        Dashboard Button
                    ================================================= */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                    >

                        Go to Dashboard

                    </button>

                </div>

            </div>

        );
    }


    // =========================================================
    // Loading Request Status
    // =========================================================

    if (checking) {

        return (

            <div className="min-h-screen bg-gray-50 flex items-center justify-center">

                <div className="text-center">

                    <FaClock className="text-blue-600 text-3xl mx-auto animate-pulse" />

                    <p className="text-gray-500 mt-3">

                        Checking subscription status...

                    </p>

                </div>

            </div>

        );
    }


    // =========================================================
    // Premium Request Page
    // =========================================================

    return (

        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

            <div className="max-w-5xl w-full">


                {/* =================================================
                    Header
                ================================================= */}

                <div className="text-center mb-10">

                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full font-semibold text-sm">

                        <FaCrown />

                        PREMIUM MEMBERSHIP

                    </div>


                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-5">

                        Unlock the full power of BudgetBuddy

                    </h1>


                    <p className="text-gray-500 text-lg mt-4 max-w-2xl mx-auto">

                        Get advanced financial insights, detailed reports,
                        and powerful analytics to manage your money smarter.

                    </p>

                </div>


                {/* =================================================
                    Premium Card
                ================================================= */}

                <div className="relative max-w-xl mx-auto">


                    {/* =================================================
                        Premium Badge
                    ================================================= */}

                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">

                        <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">

                            PREMIUM PLAN

                        </div>

                    </div>


                    <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-500 overflow-hidden">


                        {/* =================================================
                            Top Section
                        ================================================= */}

                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center pt-10">

                            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center">

                                <FaCrown className="text-yellow-300 text-3xl" />

                            </div>


                            <h2 className="text-3xl font-bold mt-5">

                                Premium

                            </h2>


                            <p className="text-blue-100 mt-2">

                                Advanced financial management

                            </p>


                            <div className="mt-6">

                                <span className="text-4xl font-extrabold">

                                    Premium

                                </span>

                            </div>


                            <p className="text-blue-100 text-sm mt-2">

                                Subscription access requires admin approval

                            </p>

                        </div>


                        {/* =================================================
                            Features
                        ================================================= */}

                        <div className="p-8">

                            <h3 className="font-bold text-gray-800 text-lg mb-5">

                                Everything in Premium:

                            </h3>


                            <div className="space-y-4">

                                {[
                                    "Advanced Analytics",
                                    "Monthly Income & Expense Trends",
                                    "Custom Date Range Analysis",
                                    "Spending Comparisons",
                                    "Advanced Reports",
                                    "PDF & Excel Export",
                                ].map((feature) => (

                                    <div
                                        key={feature}
                                        className="flex items-center gap-4"
                                    >

                                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">

                                            <FaCheck className="text-green-600 text-sm" />

                                        </div>

                                        <span className="text-gray-700">

                                            {feature}

                                        </span>

                                    </div>

                                ))}

                            </div>


                            {/* =================================================
                                Success Message
                            ================================================= */}

                            {message && (

                                <div className="mt-7 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">

                                    <div className="flex items-center gap-3">

                                        <FaCheck />

                                        <span className="font-medium">

                                            {message}

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Error Message
                            ================================================= */}

                            {error && (

                                <div className="mt-7 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">

                                    <div className="flex items-center gap-3">

                                        <FaTimesCircle />

                                        <span>

                                            {error}

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Pending
                            ================================================= */}

                            {requestStatus === "pending" && (

                                <div className="mt-7">

                                    <div className="w-full bg-yellow-50 border-2 border-yellow-300 text-yellow-700 py-5 rounded-xl text-center">

                                        <FaClock className="mx-auto text-2xl mb-2" />

                                        <p className="font-bold text-lg">

                                            Waiting for Admin Approval

                                        </p>

                                        <p className="text-sm mt-1">

                                            Your Premium request has been sent
                                            to the administrator.

                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Rejected
                            ================================================= */}

                            {requestStatus === "rejected" && (

                                <div className="mt-7">

                                    <div className="w-full bg-red-50 border-2 border-red-200 text-red-600 py-5 rounded-xl text-center">

                                        <FaTimesCircle className="mx-auto text-2xl mb-2" />

                                        <p className="font-bold text-lg">

                                            Request Rejected

                                        </p>

                                        <p className="text-sm mt-1">

                                            Your previous Premium request
                                            was rejected by the administrator.

                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Approved
                            ================================================= */}

                            {requestStatus === "approved" && (

                                <div className="mt-7">

                                    <div className="w-full bg-green-50 border-2 border-green-200 text-green-700 py-5 rounded-xl text-center">

                                        <FaCheck className="mx-auto text-2xl mb-2" />

                                        <p className="font-bold text-lg">

                                            Premium Approved

                                        </p>

                                        <p className="text-sm mt-1">

                                            Your Premium access has been approved.

                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Cancelled
                            ================================================= */}

                            {requestStatus === "cancelled" && (

                                <div className="mt-7">

                                    <div className="w-full bg-gray-50 border-2 border-gray-200 text-gray-600 py-5 rounded-xl text-center">

                                        <FaTimesCircle className="mx-auto text-2xl mb-2" />

                                        <p className="font-bold text-lg">

                                            Premium Subscription Removed

                                        </p>

                                        <p className="text-sm mt-1">

                                            Your account is currently on the
                                            Student plan.

                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                Request Button
                            ================================================= */}

                            {(
                                !requestStatus ||
                                requestStatus === "rejected" ||
                                requestStatus === "cancelled"
                            ) ? (

                                <button
                                    type="button"
                                    onClick={handleRequestPremium}
                                    disabled={loading}
                                    className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >

                                    {loading
                                        ? "Sending Request..."
                                        : requestStatus === "rejected"
                                            ? "Request Premium Again"
                                            : "Request Premium Access"
                                    }

                                </button>

                            ) : null}


                            {/* =================================================
                                Back Button
                            ================================================= */}

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/dashboard")
                                }
                                className="mt-4 w-full text-gray-500 py-3 hover:text-gray-700 transition"
                            >

                                Back to Dashboard

                            </button>


                            {/* =================================================
                                Footer Note
                            ================================================= */}

                            <p className="text-center text-xs text-gray-400 mt-5">

                                Your account will be upgraded only after
                                administrator approval.

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}


export default UpgradePremium;