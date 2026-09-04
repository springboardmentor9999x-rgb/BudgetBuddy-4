import api from "../api/axios";

const BASE = "/income";

export const getIncome = async (month) => {
  const response = await api.get(`${BASE}/`, { params: { month } });
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
