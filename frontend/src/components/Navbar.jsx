import { useEffect, useState, useCallback } from "react";

import {
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import {
  getNotifications,
} from "../api/notification";


function Navbar({ user }) {

  const navigate = useNavigate();


  // =========================================================
  // Notifications
  // =========================================================

  const [notifications, setNotifications] =
    useState([]);


  // =========================================================
  // Load Notifications
  // =========================================================

  const loadNotifications = useCallback(async () => {

    try {

      const data =
        await getNotifications();

      setNotifications(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Failed to load notifications:",
        error
      );

    }

  }, []);


  // =========================================================
  // Notification Refresh
  // =========================================================

  useEffect(() => {

    // Load immediately when Navbar appears
    loadNotifications();


    // ---------------------------------------------------------
    // Refresh every 5 seconds
    // ---------------------------------------------------------

    const interval =
      setInterval(() => {

        loadNotifications();

      }, 5000);


    // ---------------------------------------------------------
    // Refresh immediately when user returns to tab
    // ---------------------------------------------------------

    const handleVisibilityChange = () => {

      if (
        document.visibilityState === "visible"
      ) {

        loadNotifications();

      }

    };


    // ---------------------------------------------------------
    // Refresh immediately when browser window gets focus
    // ---------------------------------------------------------

    const handleFocus = () => {

      loadNotifications();

    };


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleFocus
    );


    // ---------------------------------------------------------
    // Cleanup
    // ---------------------------------------------------------

    return () => {

      clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

    };

  }, [loadNotifications]);


  // =========================================================
  // Unread Count
  // =========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  // =========================================================
  // Profile Image URL
  // =========================================================

  const getProfileImageUrl = () => {

    const profileImage =
      user?.profile_image;


    if (!profileImage) {
      return null;
    }


    if (
      profileImage.startsWith("http")
    ) {

      return profileImage;

    }


    return `http://127.0.0.1:8000${profileImage}`;

  };


  const profileImageUrl =
    getProfileImageUrl();


  // =========================================================
  // UI
  // =========================================================

  return (

    <header
      className="
        sticky
        top-0
        z-50
        bg-white
        border-b
        border-gray-200
        h-16
        flex
        items-center
        justify-between
        px-8
        flex-shrink-0
      "
    >

      {/* =====================================================
          Logo
      ===================================================== */}

      <h1
        className="
          text-2xl
          font-bold
          text-blue-600
          cursor-pointer
        "
        onClick={() =>
          navigate("/")
        }
      >
        BudgetBuddy
      </h1>


      {/* =====================================================
          Right Side
      ===================================================== */}

      <div
        className="
          flex
          items-center
          gap-6
        "
      >

        {/* ===================================================
            Notification Bell
        =================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate("/notifications")
          }
          className="
            relative
            text-gray-600
            hover:text-blue-600
            transition
          "
          title="Notifications"
        >

          <FaBell size={20} />


          {unreadCount > 0 && (

            <span
              className="
                absolute
                -top-2
                -right-2
                bg-red-500
                text-white
                text-[10px]
                font-bold
                rounded-full
                min-w-[18px]
                h-[18px]
                flex
                items-center
                justify-center
                px-1
              "
            >

              {unreadCount > 99
                ? "99+"
                : unreadCount}

            </span>

          )}

        </button>


        {/* ===================================================
            User Account
        =================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate("/settings")
          }
          className="
            flex
            items-center
            gap-3
            text-left
            hover:bg-gray-50
            rounded-xl
            px-2
            py-1
            transition
            cursor-pointer
          "
          title="Account Settings"
        >

          {/* =================================================
              Profile Picture
          ================================================= */}

          <div
            className="
              w-10
              h-10
              rounded-full
              overflow-hidden
              bg-gray-200
              flex
              items-center
              justify-center
              flex-shrink-0
              border
              border-gray-200
            "
          >

            {profileImageUrl ? (

              <img
                src={profileImageUrl}
                alt="Profile"
                className="
                  w-full
                  h-full
                  object-cover
                "
              />

            ) : (

              <FaUserCircle
                size={40}
                className="text-gray-500"
              />

            )}

          </div>


          {/* =================================================
              User Information
          ================================================= */}

          <div>

            <p
              className="
                font-semibold
                text-gray-800
              "
            >
              {user?.full_name ||
                "User"}
            </p>

            <p
              className="
                text-xs
                text-gray-500
              "
            >
              {user?.role ||
                "student"}
            </p>

          </div>

        </button>

      </div>

    </header>

  );

}


export default Navbar;