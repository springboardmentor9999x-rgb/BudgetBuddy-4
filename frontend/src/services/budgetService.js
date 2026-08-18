import api from "../api/axios";

const BASE = "/budgets";

export const getBudgetSummary = async (month) => {
  const response = await api.get(`${BASE}/summary`, { params: { month } });
  return response.data;
};

export const createBudget = async (budget) => {
  const response = await api.post(`${BASE}/`, budget);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`${BASE}/${id}`);
  return response.data;
};
