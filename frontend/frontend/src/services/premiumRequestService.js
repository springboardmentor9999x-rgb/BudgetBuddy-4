import api from "./api";

export const requestPremium = async (note) => {
  const response = await api.post("/premium-requests", { note: note || null });
  return response.data;
};

export const getMyPremiumRequest = async () => {
  const response = await api.get("/premium-requests/me");
  return response.data;
};
