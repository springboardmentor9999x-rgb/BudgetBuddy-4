import api from "../api/axios";

const BASE = "/income";

export const getIncome = async () => {
  const response = await api.get(`${BASE}/`);
  return response.data;
};

export const createIncome = async (income) => {
  const response = await api.post(`${BASE}/`, income);
  return response.data;
};

export const updateIncome = async (id, income) => {
  const response = await api.put(`${BASE}/${id}`, income);
  return response.data;
};

export const deleteIncome = async (id) => {
  const response = await api.delete(`${BASE}/${id}`);
  return response.data;
};
