import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Settings() {
  const {
    user,
    logout,
    deleteAccount,
  } = useAuth();

  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // -------------------------
  // Logout
  // -------------------------
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // -------------------------
  // Delete Account
  // -------------------------
  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error(
        "Please enter your current password."
      );
      return;
    }

    setLoading(true);

    try {
      await deleteAccount(password);

      toast.success(
        "Your account has been deleted successfully."
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to delete account."
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (loading) return;

    setShowDeleteModal(false);
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <Navbar user={user} />

        <main className="p-8">

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Settings
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your BudgetBuddy account.
            </p>
          </div>

          {/* Account Information */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl">

            <h2 className="text-xl font-semibold text-gray-900">
              Account Settings
            </h2>

            <p className="text-gray-500 text-sm mt-1 mb-6">
              View your account information.
            </p>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Full Name
                </p>

                <p className="font-medium text-gray-900">
                  {user?.full_name || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Email Address
                </p>

                <p className="font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Account Role
                </p>

                <p className="font-medium text-gray-900 capitalize">
                  {user?.role}
                </p>
              </div>

            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 max-w-3xl border border-red-200 bg-white rounded-xl shadow-sm overflow-hidden">

            <div className="p-6">

              <h2 className="text-xl font-semibold text-red-600">
                Danger Zone
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Actions in this section can permanently
                affect your account.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-red-100 bg-red-50 rounded-lg p-5">

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Delete Account
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    Permanently delete your account and
                    associated BudgetBuddy data.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(true)
                  }
                  className="shrink-0 bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete Account
                </button>

              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-4">
              !
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Delete your account?
            </h2>

            <p className="text-gray-600 mt-3">
              This action is permanent. Your account and
              associated BudgetBuddy data will be deleted.
            </p>

            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-red-700">
                You can create a new account later using
                the same email address, but your old
                account data will not be restored.
              </p>
            </div>

            <form
              onSubmit={handleDeleteAccount}
              className="mt-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your current password to confirm
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Current password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />

              <div className="flex gap-3 mt-6">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
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