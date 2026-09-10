import api from "./api";

export const getAdminDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const activateUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/activate`);
  return response.data;
};

export const deactivateUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/deactivate`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getActivityLogs = async () => {
  const response = await api.get("/admin/activity-logs");
  return response.data;
};

export const sendAnnouncement = async ({ title, message, target_user_id }) => {
  const response = await api.post("/admin/announcements", {
    title,
    message,
    target_user_id: target_user_id || null,
  });
  return response.data;
};

export const updateUserTier = async (userId, account_tier) => {
  const response = await api.put(`/admin/users/${userId}/tier`, { account_tier });
  return response.data;
};


export const getSystemAnalytics = async () => {
  const response = await api.get("/admin/system-analytics");
  return response.data;
};

export const getPremiumRequests = async (status) => {
  const response = await api.get("/admin/premium-requests", { params: status ? { status } : {} });
  return response.data;
};

export const approvePremiumRequest = async (requestId) => {
  const response = await api.post(`/admin/premium-requests/${requestId}/approve`);
  return response.data;
};

export const rejectPremiumRequest = async (requestId) => {
  const response = await api.post(`/admin/premium-requests/${requestId}/reject`);
  return response.data;
};
