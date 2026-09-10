import { useState } from "react";
import { toast } from "../utils/notifications";

import { changePassword } from "../services/settingsService";
import { validatePassword } from "../utils/validators";
import PasswordStrength from "./PasswordStrength";

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error(
        "New password must be 8+ characters with uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm p-3 mb-3">
      <h5>Change Password</h5>
      <form onSubmit={handleSubmit}>
        <label className="mt-2">Current Password</label>
        <input
          type="password"
          className="form-control"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <label className="mt-2">New Password</label>
        <input
          type="password"
          className="form-control"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {newPassword && <PasswordStrength password={newPassword} />}

        <label className="mt-2">Confirm New Password</label>
        <input
          type="password"
          className="form-control"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="btn btn-primary mt-3 w-100" disabled={saving}>
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordCard;
