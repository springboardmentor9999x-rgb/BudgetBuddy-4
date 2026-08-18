import api from "../api/axios";

export const getProfile = async () => (await api.get("/profile/me")).data;
export const updateProfile = async ({ full_name, phone, address }) => (
  await api.put("/profile/me", { full_name, phone, address })
).data;
