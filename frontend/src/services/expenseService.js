import api from "../api/axios";

const BASE = "/expenses";

export const getExpenses = async () => {
  const response = await api.get(BASE);
  return response.data;
};

export const createExpense = async (expense) => {
  const response = await api.post(BASE, expense);
  return response.data;
};

export const updateExpense = async (id, expense) => {
  const response = await api.put(`${BASE}/${id}`, expense);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`${BASE}/${id}`);
  return response.data;
};