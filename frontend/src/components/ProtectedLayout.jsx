import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import {
  getNotifications,
} from "../api/notification";


function ProtectedLayout({ children }) {

  const { user, logout } = useAuth();

  const navigate = useNavigate();


  // =========================================================
  // Notification State
  // =========================================================

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
  // Get Shown Notification IDs
  // =========================================================

  const getShownNotificationIds = () => {

    try {

      const stored =
        localStorage.getItem(
          "budgetbuddy_shown_notifications"
        );

      if (!stored) {
        return [];
      }

      return JSON.parse(stored);

    } catch (error) {

      console.error(
        "Failed to read notification history:",
        error
      );

      return [];

    }
  };


  // =========================================================
  // Mark Notification as Shown
  // =========================================================

  const markPopupAsShown = (
    notificationId
  ) => {

    try {

      const shownIds =
        getShownNotificationIds();


      if (
        !shownIds.includes(
          notificationId
        )
      ) {

        shownIds.push(
          notificationId
        );

        localStorage.setItem(
          "budgetbuddy_shown_notifications",
          JSON.stringify(shownIds)
        );

      }

    } catch (error) {

      console.error(
        "Failed to save notification:",
        error
      );

    }
  };


  // =========================================================
  // Check Notifications
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


      const shownIds =
        getShownNotificationIds();


      const newNotification =
        notifications.find(
          (item) =>
            !shownIds.includes(
              item.id
            )
        );


      if (!newNotification) {
        return;
      }


      markPopupAsShown(
        newNotification.id
      );


      setNotification(
        newNotification
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
  // Initial Notification Check
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


    const interval =
      setInterval(() => {

        checkNotifications();

      }, 30000);


    return () => {

      clearInterval(interval);

    };

  }, [user]);


  // =========================================================
  // Auto Close Popup
  // =========================================================

  useEffect(() => {

    if (!showPopup) {
      return;
    }


    const timer =
      setTimeout(() => {

        setShowPopup(false);

      }, 5000);


    return () => {

      clearTimeout(timer);

    };

  }, [showPopup]);


  // =========================================================
  // View Notification Details
  // =========================================================

  const handleViewDetails = () => {

    setShowPopup(false);

    navigate("/notifications");

  };


  // =========================================================
  // Close Notification
  // =========================================================

  const handleClosePopup = () => {

    setShowPopup(false);

  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      className="
        min-h-screen
        bg-slate-100
        flex
      "
    >

      {/* =====================================================
          Sidebar
      ===================================================== */}

      <Sidebar
        onLogout={handleLogout}
      />


      {/* =====================================================
          Main Application Area
      ===================================================== */}

      <div
        className="
          flex-1
          flex
          flex-col
          min-w-0
        "
      >

        {/* ===================================================
            Navbar
        =================================================== */}

        <Navbar
          user={user}
        />


        {/* ===================================================
            Page Content
        =================================================== */}

        <main
          className="
            flex-1
            p-8
            min-h-screen
          "
        >

          {children}

        </main>

      </div>


      {/* =====================================================
          Notification Popup
      ===================================================== */}

      {showPopup && notification && (

        <div
          className="
            fixed
            top-20
            right-6
            z-[9999]
            w-[420px]
            max-w-[calc(100vw-32px)]
          "
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              border
              border-gray-200
              overflow-hidden
            "
          >

            {/* =================================================
                Top Border
            ================================================= */}

            <div
              className="
                h-1
                bg-blue-600
              "
            />


            {/* =================================================
                Content
            ================================================= */}

            <div
              className="
                p-6
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >

                {/* =================================================
                    Icon
                ================================================= */}

                <div
                  className="
                    w-14
                    h-14
                    rounded-full
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                    text-2xl
                    flex-shrink-0
                  "
                >
                  🔔
                </div>


                {/* =================================================
                    Message
                ================================================= */}

                <div
                  className="
                    flex-1
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >

                    <h3
                      className="
                        text-xl
                        font-bold
                        text-gray-900
                      "
                    >
                      New Notification
                    </h3>


                    <button
                      type="button"
                      onClick={
                        handleClosePopup
                      }
                      className="
                        text-gray-400
                        hover:text-gray-700
                        text-2xl
                        leading-none
                      "
                      title="Close"
                    >
                      ×
                    </button>

                  </div>


                  <p
                    className="
                      text-gray-600
                      text-base
                      mt-2
                      leading-6
                    "
                  >
                    {notification.message}
                  </p>


                  {notification.created_at && (

                    <p
                      className="
                        text-sm
                        text-gray-400
                        mt-3
                      "
                    >
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </p>

                  )}

                </div>

              </div>


              {/* =================================================
                  Buttons
              ================================================= */}

              <div
                className="
                  flex
                  gap-3
                  mt-6
                "
              >

                <button
                  type="button"
                  onClick={
                    handleViewDetails
                  }
                  className="
                    flex-1
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    font-semibold
                    py-3
                    rounded-lg
                    transition
                  "
                >
                  View Details
                </button>


                <button
                  type="button"
                  onClick={
                    handleClosePopup
                  }
                  className="
                    px-6
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-700
                    font-semibold
                    rounded-lg
                    transition
                  "
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