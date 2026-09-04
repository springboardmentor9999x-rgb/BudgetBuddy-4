import api from "../api/axios";

export const getDashboard = async (month) => {
  const response = await api.get("/dashboard", { params: { month } });
  return response.data;
};
