const notifyDataChanged = () => window.dispatchEvent(new CustomEvent("bb:data-changed"));

import api from "./api";

export const getSavingsGoals = async () => {
  const response = await api.get("/savings-goal/");
  return response.data;
};

export const addSavingsGoal = async (goal) => {
  const response = await api.post("/savings-goal/", goal);
  notifyDataChanged();
    return response.data;
};

export const updateSavingsGoal = async (id, goal) => {
  const response = await api.put(`/savings-goal/${id}`, goal);
  notifyDataChanged();
    return response.data;
};

export const deleteSavingsGoal = async (id) => {
  const response = await api.delete(`/savings-goal/${id}`);
  notifyDataChanged();
    return response.data;
};

export const contributeSavingsGoal = async (id, amount) => {
  const response = await api.post(`/savings-goal/${id}/contribute`, { amount });
  notifyDataChanged();
    return response.data;
};
