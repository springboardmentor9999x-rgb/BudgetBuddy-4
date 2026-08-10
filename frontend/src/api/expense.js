import api from "./axios";

// Get all expenses
export const getExpenses = async () => {
  const response = await api.get("/expenses/");
  return response.data;
};

// Create expense
export const createExpense = async (data) => {
  const response = await api.post("/expenses/", data);
  return response.data;
};

// Update expense
export const updateExpense = async (id, data) => {
  const response = await api.put(`/expenses/${id}`, data);
  return response.data;
};

// Delete expense
export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};