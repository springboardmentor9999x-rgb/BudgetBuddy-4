import { useEffect, useState } from "react";
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

  const loadNotifications = async () => {

    try {

      const data =
        await getNotifications();

      setNotifications(
        data || []
      );

    } catch (error) {

      console.error(
        "Failed to load notifications:",
        error
      );

    }
  };


  // =========================================================
  // Load Notifications on Mount
  // =========================================================

  useEffect(() => {

    loadNotifications();


    // Check notifications every 30 seconds
    const interval =
      setInterval(() => {

        loadNotifications();

      }, 30000);


    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


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


    // No profile picture
    if (!profileImage) {
      return null;
    }


    // Backend already returned complete URL
    if (
      profileImage.startsWith(
        "http"
      )
    ) {
      return profileImage;
    }


    // Local FastAPI backend
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
        bg-white
        border-b
        border-gray-200
        h-16
        flex
        items-center
        justify-between
        px-8
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
        "
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
            navigate(
              "/notifications"
            )
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


          {/* Unread Badge */}

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
            navigate(
              "/settings"
            )
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