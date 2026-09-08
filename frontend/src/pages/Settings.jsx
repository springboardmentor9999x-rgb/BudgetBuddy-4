import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaCheckCircle,
  FaShieldAlt,
  FaUser,
  FaTrash,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import {
  getProfile,
  updateProfile,
  uploadProfileImage,
} from "../api/profile";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";


function Settings() {

  const {
    user,
    logout,
    deleteAccount,
    updateUserProfile,
  } = useAuth();

  const navigate = useNavigate();


  // =========================================================
  // Profile State
  // =========================================================

  const [profile, setProfile] = useState({
    full_name: "",
    monthly_income: "",
    currency: "INR",
    profile_image: null,
  });


  const [profileLoading, setProfileLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);


  // =========================================================
  // Delete Account State
  // =========================================================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =========================================================
  // Load Profile
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, []);


  const loadProfile = async () => {

    try {

      setProfileLoading(true);

      const data = await getProfile();

      setProfile({
        full_name:
          data.full_name || "",

        monthly_income:
          data.monthly_income ?? "",

        currency:
          data.currency || "INR",

        profile_image:
          data.profile_image || null,
      });


      // -------------------------------------------------------
      // Keep AuthContext synchronized
      // -------------------------------------------------------

      updateUserProfile(data);

    } catch (error) {

      console.error(
        "Failed to load profile:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Unable to load profile."
      );

    } finally {

      setProfileLoading(false);

    }
  };


  // =========================================================
  // Profile Image URL
  // =========================================================

  const getProfileImageUrl = () => {

    if (!profile.profile_image) {
      return null;
    }


    // Backend returned complete URL
    if (
      profile.profile_image.startsWith(
        "http"
      )
    ) {
      return profile.profile_image;
    }


    // Local FastAPI backend
    return `${import.meta.env.VITE_API_URL}${profile.profile_image}`;
  };


  // =========================================================
  // Handle Profile Image Upload
  // =========================================================

  const handleProfileImageChange = async (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    // -------------------------------------------------------
    // Validate File Type
    // -------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      toast.error(
        "Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";

      return;
    }


    // -------------------------------------------------------
    // Validate File Size
    // -------------------------------------------------------

    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {

      toast.error(
        "Profile image must be smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }


    try {

      setUploadingImage(true);


      const updatedProfile =
        await uploadProfileImage(
          file
        );


      // -----------------------------------------------------
      // Update Settings Page
      // -----------------------------------------------------

      setProfile((previous) => ({
        ...previous,

        profile_image:
          updatedProfile.profile_image ||
          null,
      }));


      // -----------------------------------------------------
      // Update Global AuthContext
      // -----------------------------------------------------

      updateUserProfile(
        updatedProfile
      );


      toast.success(
        "Profile picture updated successfully."
      );

    } catch (error) {

      console.error(
        "Profile image upload failed:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Unable to upload profile picture."
      );

    } finally {

      setUploadingImage(false);

      event.target.value = "";
    }
  };


  // =========================================================
  // Handle Profile Change
  // =========================================================

  const handleProfileChange = (
    e
  ) => {

    const {
      name,
      value,
    } = e.target;


    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =========================================================
  // Save Profile
  // =========================================================

  const handleSaveProfile = async (
    e
  ) => {

    e.preventDefault();


    if (!profile.full_name.trim()) {

      toast.error(
        "Full name is required."
      );

      return;
    }


    if (
      profile.monthly_income !== "" &&
      Number(
        profile.monthly_income
      ) < 0
    ) {

      toast.error(
        "Monthly income cannot be negative."
      );

      return;
    }


    try {

      setSavingProfile(true);


      const updatedProfile =
        await updateProfile({

          full_name:
            profile.full_name.trim(),

          monthly_income:
            profile.monthly_income === ""
              ? 0
              : Number(
                profile.monthly_income
              ),

          currency:
            profile.currency,
        });


      // -----------------------------------------------------
      // Update Settings Page
      // -----------------------------------------------------

      setProfile((previous) => ({
        ...previous,

        full_name:
          updatedProfile.full_name ||
          "",

        monthly_income:
          updatedProfile.monthly_income ??
          0,

        currency:
          updatedProfile.currency ||
          "INR",

        profile_image:
          updatedProfile.profile_image ||
          previous.profile_image ||
          null,
      }));


      // -----------------------------------------------------
      // Update Global AuthContext
      // -----------------------------------------------------

      updateUserProfile(
        updatedProfile
      );


      toast.success(
        "Profile updated successfully."
      );

    } catch (error) {

      console.error(
        "Failed to update profile:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Unable to update profile."
      );

    } finally {

      setSavingProfile(false);

    }
  };


  // =========================================================
  // Profile Completion
  // =========================================================

  const calculateProfileCompletion = () => {

    let completed = 0;

    const total = 4;


    if (
      profile.full_name.trim()
    ) {
      completed++;
    }


    if (
      user?.email
    ) {
      completed++;
    }


    if (
      profile.monthly_income !== "" &&
      Number(
        profile.monthly_income
      ) > 0
    ) {
      completed++;
    }


    if (
      profile.profile_image
    ) {
      completed++;
    }


    return Math.round(
      (completed / total) * 100
    );
  };


  const profileCompletion =
    calculateProfileCompletion();


  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {

    logout();

    navigate(
      "/login"
    );
  };


  // =========================================================
  // Delete Account
  // =========================================================

  const handleDeleteAccount = async (
    e
  ) => {

    e.preventDefault();


    if (!password) {

      toast.error(
        "Please enter your current password."
      );

      return;
    }


    setLoading(true);


    try {

      await deleteAccount(
        password
      );


      toast.success(
        "Your account has been deleted successfully."
      );


      navigate(
        "/login",
        {
          replace: true,
        }
      );

    } catch (error) {

      toast.error(
        error.response?.data?.detail ||
        "Unable to delete account."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // Close Delete Modal
  // =========================================================

  const closeModal = () => {

    if (loading) {
      return;
    }


    setShowDeleteModal(
      false
    );

    setPassword("");
  };


  // =========================================================
  // Loading
  // =========================================================

  if (profileLoading) {

    return (
      <div className="min-h-screen bg-slate-100 flex">

        <Sidebar
          onLogout={
            handleLogout
          }
        />

        <div className="flex-1 flex flex-col">

          <Navbar user={user} />

          <main className="flex-1 p-8">

            <div className="max-w-6xl mx-auto">

              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10 text-center">

                <p className="text-gray-500">
                  Loading profile...
                </p>

              </div>

            </div>

          </main>

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 flex">


      {/* =================================================
          Sidebar
      ================================================= */}

      <Sidebar
        onLogout={
          handleLogout
        }
      />


      {/* =================================================
          Main Area
      ================================================= */}

      <div className="flex-1 flex flex-col min-w-0">


        {/* =================================================
            Navbar
        ================================================= */}

        <Navbar user={user} />


        <main className="flex-1 p-8">


          <div className="max-w-6xl mx-auto">


            {/* =================================================
                Page Header
            ================================================= */}

            <div className="mb-8">

              <h1 className="text-4xl font-bold text-gray-900">
                My Profile
              </h1>

              <p className="text-gray-500 mt-2">
                Manage your personal information,
                account and security.
              </p>

            </div>


            {/* =================================================
                Profile Header Card
            ================================================= */}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">


              {/* Blue Header */}

              <div className="h-32 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500" />


              <div className="px-8 pb-8">


                <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">


                  {/* Profile Picture */}

                  <div className="relative">


                    <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">

                      <div className="w-full h-full rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">


                        {getProfileImageUrl() ? (

                          <img
                            src={
                              getProfileImageUrl()
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          <FaUser
                            className="text-blue-500"
                            size={48}
                          />

                        )}

                      </div>

                    </div>


                    {/* Camera Button */}

                    <label
                      htmlFor="profile-image"
                      className="
                        absolute
                        bottom-1
                        right-1
                        w-10
                        h-10
                        rounded-full
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        shadow-lg
                        transition
                      "
                      title="Upload Profile Picture"
                    >

                      {uploadingImage ? (

                        <span className="text-xs">
                          ...
                        </span>

                      ) : (

                        <FaCamera
                          size={16}
                        />

                      )}

                    </label>


                    <input
                      id="profile-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleProfileImageChange
                      }
                      className="hidden"
                      disabled={
                        uploadingImage
                      }
                    />

                  </div>


                  {/* Profile Identity */}

                  <div className="flex-1 pb-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-4xl font-extrabold text-white drop-shadow-sm">

                        {profile.full_name ||
                          "Your Name"}

                      </h2>


                      {user?.is_email_verified !== false && (

                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">

                          <FaCheckCircle />

                          Verified

                        </span>

                      )}

                    </div>


                    <p className="text-lg font-medium text-gray-700 mt-2">
                      {user?.email}
                    </p>


                    <p className="text-sm font-semibold text-gray-500 mt-1 capitalize">
                      {user?.role || "student"}
                    </p>

                  </div>


                  {/* Completion */}

                  <div className="w-full md:w-52">

                    <div className="flex justify-between text-sm mb-2">

                      <span className="font-medium text-gray-600">
                        Profile completion
                      </span>

                      <span className="font-bold text-blue-600">
                        {profileCompletion}%
                      </span>

                    </div>


                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${profileCompletion}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>


                <p className="text-sm text-gray-500 mt-5">

                  Click the camera button to upload
                  your profile picture.

                  <span className="text-gray-400">
                    {" "}
                    JPG, PNG or WEBP · Max 5 MB
                  </span>

                </p>

              </div>

            </div>


            {/* =================================================
                Main Grid
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


              {/* =================================================
                  Personal Information
              ================================================= */}

              <div className="lg:col-span-2">

                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-7">


                  <div className="mb-7">

                    <h2 className="text-2xl font-bold text-gray-900">
                      Personal Information
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                      Update the information used
                      across your BudgetBuddy account.
                    </p>

                  </div>


                  <form
                    onSubmit={
                      handleSaveProfile
                    }
                  >


                    {/* Full Name */}

                    <div className="mb-6">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>

                      <input
                        type="text"
                        name="full_name"
                        value={
                          profile.full_name
                        }
                        onChange={
                          handleProfileChange
                        }
                        placeholder="Enter your full name"
                        maxLength={100}
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-gray-900
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                          focus:border-blue-500
                        "
                        required
                      />

                    </div>


                    {/* Email */}

                    <div className="mb-6">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>

                      <div className="relative">

                        <input
                          type="email"
                          value={
                            user?.email ||
                            ""
                          }
                          disabled
                          className="
                            w-full
                            bg-gray-100
                            border
                            border-gray-300
                            text-gray-500
                            rounded-xl
                            px-4
                            py-3
                            cursor-not-allowed
                          "
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          🔒
                        </span>

                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Email address cannot be changed.
                      </p>

                    </div>


                    {/* Role */}

                    <div className="mb-6">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Account Role
                      </label>

                      <input
                        type="text"
                        value={
                          user?.role ||
                          "User"
                        }
                        disabled
                        className="
                          w-full
                          bg-gray-100
                          border
                          border-gray-300
                          text-gray-500
                          rounded-xl
                          px-4
                          py-3
                          cursor-not-allowed
                          capitalize
                        "
                      />

                    </div>


                    {/* Monthly Income */}

                    <div className="mb-6">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Monthly Income
                      </label>

                      <div className="relative">

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="monthly_income"
                          value={
                            profile.monthly_income
                          }
                          onChange={
                            handleProfileChange
                          }
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Enter monthly income"
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-xl
                            pl-9
                            pr-4
                            py-3
                            text-gray-900
                            focus:outline-none
                            focus:ring-2
                            focus:ring-blue-500
                            focus:border-blue-500
                          "
                        />

                      </div>

                    </div>


                    {/* Currency */}

                    <div className="mb-7">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Currency
                      </label>

                      <select
                        name="currency"
                        value={
                          profile.currency
                        }
                        onChange={
                          handleProfileChange
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-xl
                          px-4
                          py-3
                          text-gray-900
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                          focus:border-blue-500
                        "
                      >

                        <option value="INR">
                          INR — Indian Rupee
                        </option>

                        <option value="USD">
                          USD — US Dollar
                        </option>

                        <option value="EUR">
                          EUR — Euro
                        </option>

                        <option value="GBP">
                          GBP — British Pound
                        </option>

                      </select>

                    </div>


                    {/* Save */}

                    <button
                      type="submit"
                      disabled={
                        savingProfile
                      }
                      className="
                        bg-blue-600
                        hover:bg-blue-700
                        disabled:bg-blue-300
                        text-white
                        font-semibold
                        px-7
                        py-3
                        rounded-xl
                        transition
                        duration-200
                      "
                    >

                      {savingProfile
                        ? "Saving..."
                        : "Save Changes"}

                    </button>

                  </form>

                </div>

              </div>


              {/* =================================================
                  Right Side
              ================================================= */}

              <div className="space-y-8">


                {/* Security */}

                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">

                  <div className="flex items-center gap-3 mb-5">

                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">

                      <FaShieldAlt />

                    </div>

                    <div>

                      <h2 className="font-bold text-gray-900">
                        Account Security
                      </h2>

                      <p className="text-xs text-gray-500">
                        Your account protection
                      </p>

                    </div>

                  </div>


                  <div className="space-y-4">

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-gray-600">
                        Account status
                      </span>

                      <span className="text-sm font-semibold text-green-600">
                        ● Active
                      </span>

                    </div>


                    <div className="flex items-center justify-between">

                      <span className="text-sm text-gray-600">
                        Email verification
                      </span>

                      <span className="text-sm font-semibold text-green-600">
                        Verified
                      </span>

                    </div>


                    <div className="pt-4 border-t border-gray-100">

                      <p className="text-xs text-gray-500 leading-5">
                        Keep your account information
                        accurate and never share your
                        password with anyone.
                      </p>

                    </div>

                  </div>

                </div>


                {/* Account Info */}

                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">

                  <h2 className="font-bold text-gray-900 mb-5">
                    Account Information
                  </h2>


                  <div className="space-y-4">

                    <div>

                      <p className="text-xs text-gray-500">
                        User ID
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {user?.id ||
                          "N/A"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Role
                      </p>

                      <p className="font-semibold text-gray-900 mt-1 capitalize">
                        {user?.role ||
                          "N/A"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Member since
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        BudgetBuddy member
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                Danger Zone
            ================================================= */}

            <div className="mt-8 max-w-3xl border border-red-200 bg-white rounded-3xl shadow-sm overflow-hidden">

              <div className="p-7">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">

                    <FaTrash />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-red-600">
                      Danger Zone
                    </h2>

                    <p className="text-gray-500 text-sm">
                      Actions here can permanently affect
                      your account.
                    </p>

                  </div>

                </div>


                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-red-100 bg-red-50 rounded-xl p-5">

                  <div>

                    <h3 className="font-semibold text-gray-900">
                      Delete Account
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      Permanently delete your account
                      and associated BudgetBuddy data.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setShowDeleteModal(
                        true
                      )
                    }
                    className="
                      shrink-0
                      bg-red-600
                      text-white
                      px-5
                      py-2.5
                      rounded-lg
                      font-medium
                      hover:bg-red-700
                      transition
                    "
                  >
                    Delete Account
                  </button>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>


      {/* =================================================
          Delete Confirmation Modal
      ================================================= */}

      {showDeleteModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">


            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-4">
              !
            </div>


            <h2 className="text-2xl font-bold text-gray-900">
              Delete your account?
            </h2>


            <p className="text-gray-600 mt-3">
              This action is permanent. Your account
              and associated BudgetBuddy data will
              be deleted.
            </p>


            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-4">

              <p className="text-sm text-red-700">
                You can create a new account later
                using the same email address, but
                your old account data will not be restored.
              </p>

            </div>


            <form
              onSubmit={
                handleDeleteAccount
              }
              className="mt-6"
            >

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your current password to confirm
              </label>


              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Current password"
                autoComplete="current-password"
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-lg
                  px-4
                  py-3
                  outline-none
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-100
                "
              />


              <div className="flex gap-3 mt-6">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={loading}
                  className="
                    flex-1
                    border
                    border-gray-300
                    text-gray-700
                    py-2.5
                    rounded-lg
                    font-medium
                    hover:bg-gray-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex-1
                    bg-red-600
                    text-white
                    py-2.5
                    rounded-lg
                    font-medium
                    hover:bg-red-700
                    disabled:opacity-50
                  "
                >

                  {loading
                    ? "Deleting..."
                    : "Delete Account"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Settings;