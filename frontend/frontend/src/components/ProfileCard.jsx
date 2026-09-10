import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { toast } from "../utils/notifications";

import { useAuth } from "../context/AuthContext";
import { updateProfileSettings } from "../services/settingsService";

function ProfileCard() {
    const { user, setUser } = useAuth();

    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedUser = await updateProfileSettings({
                full_name: fullName,
                email,
            });
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            toast.success("Profile updated successfully");
            setEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Could not update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card shadow p-4 mb-4">
            <div className="text-center">
                <FaUserCircle size={80} color="#0d6efd" />

                {!editing ? (
                    <>
                        <h3 className="mt-3">{user?.full_name}</h3>
                        <p>{user?.email}</p>
                    </>
                ) : (
                    <div className="text-start mt-3">
                        <label>Full Name</label>
                        <input
                            className="form-control mb-2"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                        <label>Email</label>
                        <input
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                )}

                <span className={user?.is_verified ? "badge bg-success" : "badge bg-warning"}>
                    {user?.is_verified ? "Verified" : "Not Verified"}
                </span>

                <div className="mt-3">
                    {!editing ? (
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setEditing(true)}>
                            Edit Profile
                        </button>
                    ) : (
                        <div className="d-flex gap-2 justify-content-center">
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    setEditing(false);
                                    setFullName(user?.full_name || "");
                                    setEmail(user?.email || "");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileCard;
