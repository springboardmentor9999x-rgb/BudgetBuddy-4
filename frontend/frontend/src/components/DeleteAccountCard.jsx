import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/notifications";

import { useAuth } from "../context/AuthContext";
import { deleteMyAccount } from "../services/settingsService";

function DeleteAccountCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success("Your account has been deleted.");
      await logout();
      navigate("/");
    } catch {
      toast.error("Could not delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card shadow-sm p-3 mb-3 border-danger">
      <h5 className="text-danger">Delete Account</h5>
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        This permanently deletes your account and all of your income, expense,
        budget, and savings goal data. This cannot be undone.
      </p>
      <label>
        Type <strong>DELETE</strong> to confirm
      </label>
      <input
        className="form-control mb-2"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
      <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Permanently Delete My Account"}
      </button>
    </div>
  );
}

export default DeleteAccountCard;
