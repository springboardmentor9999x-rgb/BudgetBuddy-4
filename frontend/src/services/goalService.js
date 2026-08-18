import api from "../api/axios";

export const getGoals = async () => (await api.get("/goals/")).data;
export const createGoal = async (goal) => (await api.post("/goals/", goal)).data;
export const contributeToGoal = async (id, amount) => (await api.patch(`/goals/${id}/contribute`, { amount })).data;
export const deleteGoal = async (id) => (await api.delete(`/goals/${id}`)).data;
