import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import { getNotifications } from "../api/notification";


function ProtectedLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notification, setNotification] =
    useState(null);

  const [showPopup, setShowPopup] =
    useState(false);


  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  // =========================================================
  // Check For NEW Notifications
  // =========================================================

  const checkNotifications = async () => {
    try {
      const notifications =
        await getNotifications();


      if (
        !notifications ||
        notifications.length === 0
      ) {
        return;
      }


      // -----------------------------------------------------
      // Sort notifications from oldest to newest
      // -----------------------------------------------------

      const sortedNotifications = [
        ...notifications,
      ].sort(
        (a, b) => a.id - b.id
      );


      const latestNotification =
        sortedNotifications[
          sortedNotifications.length - 1
        ];


      // -----------------------------------------------------
      // Get the last notification ID that we already know
      // -----------------------------------------------------

      const storedLastId =
        localStorage.getItem(
          "budgetbuddy_last_notification_id"
        );


      // =====================================================
      // FIRST TIME
      //
      // Do NOT show old notifications.
      //
      // We simply remember the latest existing notification.
      // =====================================================

      if (storedLastId === null) {

        localStorage.setItem(
          "budgetbuddy_last_notification_id",
          String(latestNotification.id)
        );

        return;
      }


      const lastNotificationId =
        Number(storedLastId);


      // =====================================================
      // Find ONLY notifications created AFTER
      // the last known notification
      // =====================================================

      const newNotifications =
        sortedNotifications.filter(
          (item) =>
            item.id > lastNotificationId
        );


      // -----------------------------------------------------
      // Nothing new
      // -----------------------------------------------------

      if (newNotifications.length === 0) {
        return;
      }


      // =====================================================
      // We have a NEW notification
      //
      // Show ONLY the newest one.
      // =====================================================

      const newestNotification =
        newNotifications[
          newNotifications.length - 1
        ];


      // =====================================================
      // IMPORTANT
      //
      // Save the latest ID IMMEDIATELY.
      //
      // This prevents the same notification from appearing
      // again when the user changes pages.
      // =====================================================

      localStorage.setItem(
        "budgetbuddy_last_notification_id",
        String(latestNotification.id)
      );


      // =====================================================
      // Show Popup
      // =====================================================

      setNotification(
        newestNotification
      );

      setShowPopup(true);


    } catch (error) {

      console.error(
        "Failed to check notifications:",
        error
      );

    }
  };


  // =========================================================
  // Initial Check
  // =========================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    checkNotifications();

  }, [user]);


  // =========================================================
  // Check Every 30 Seconds
  // =========================================================

  useEffect(() => {

    if (!user) {
      return;
    }


    const interval = setInterval(
      () => {
        checkNotifications();
      },
      30000
    );


    return () => {
      clearInterval(interval);
    };

  }, [user]);


  // =========================================================
  // Automatically Hide Popup After 5 Seconds
  // =========================================================

  useEffect(() => {

    if (!showPopup) {
      return;
    }


    const timer = setTimeout(
      () => {
        setShowPopup(false);
      },
      5000
    );


    return () => {
      clearTimeout(timer);
    };

  }, [showPopup]);


  // =========================================================
  // View Details
  // =========================================================

  const handleViewDetails = () => {

    setShowPopup(false);

    navigate("/notifications");

  };


  // =========================================================
  // Close Popup
  // =========================================================

  const handleClosePopup = () => {

    setShowPopup(false);

  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100 flex">


      {/* =================================================
          Sidebar
      ================================================= */}

      <Sidebar
        onLogout={handleLogout}
      />


      {/* =================================================
          Right Side
      ================================================= */}

      <div className="flex-1 flex flex-col min-w-0">


        {/* =================================================
            Navbar
        ================================================= */}

        <Navbar user={user} />


        {/* =================================================
            Page Content
        ================================================= */}

        <main className="flex-1 p-8">
          {children}
        </main>


      </div>


      {/* =================================================
          Notification Popup
      ================================================= */}

      {showPopup && notification && (

        <div className="fixed top-6 right-6 z-[9999] w-[380px]">

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">


            {/* Top Border */}

            <div className="h-1 bg-blue-600" />


            {/* Content */}

            <div className="p-5">

              <div className="flex items-start gap-4">


                {/* Icon */}

                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                  🔔
                </div>


                {/* Message */}

                <div className="flex-1">

                  <div className="flex items-start justify-between gap-2">

                    <h3 className="font-bold text-gray-900">
                      New Notification
                    </h3>


                    <button
                      type="button"
                      onClick={
                        handleClosePopup
                      }
                      className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                      title="Close"
                    >
                      ×
                    </button>

                  </div>


                  <p className="text-gray-600 text-sm mt-2 leading-5">
                    {notification.message}
                  </p>


                  {notification.created_at && (

                    <p className="text-xs text-gray-400 mt-2">

                      {new Date(
                        notification.created_at
                      ).toLocaleString()}

                    </p>

                  )}

                </div>

              </div>


              {/* Buttons */}

              <div className="flex gap-3 mt-5">

                <button
                  type="button"
                  onClick={
                    handleViewDetails
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  View Details
                </button>


                <button
                  type="button"
                  onClick={
                    handleClosePopup
                  }
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
                >
                  Later
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default ProtectedLayout;