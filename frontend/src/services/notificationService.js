import api from "../api/axios";

export const getNotifications = async () => (await api.get("/notifications")).data;
export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
