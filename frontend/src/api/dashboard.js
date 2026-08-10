import api from "./axios";

// -------------------------
// Get Dashboard Data
// -------------------------
export const getDashboard = async () => {
  const response = await api.get("/dashboard/");
  return response.data;
};