import api from "./axios";

// Get all incomes
export const getIncomes = async () => {
  const response = await api.get("/incomes/");
  return response.data;
};

// Create income
export const createIncome = async (data) => {
  const response = await api.post("/incomes/", data);
  return response.data;
};

// Update income
export const updateIncome = async (id, data) => {
  const response = await api.put(`/incomes/${id}`, data);
  return response.data;
};

// Delete income
export const deleteIncome = async (id) => {
  const response = await api.delete(`/incomes/${id}`);
  return response.data;
};