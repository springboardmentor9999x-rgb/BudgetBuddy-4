const notifyDataChanged = () => window.dispatchEvent(new CustomEvent("bb:data-changed"));

import api from "./api";

export const addExpense = async (expense) => {
    const response = await api.post("/expense/", expense);
    notifyDataChanged();
    return response.data;
};

export const getExpense = async () => {
    const response = await api.get("/expense/");

    return Array.isArray(response.data) ? response.data : [];
};

export const updateExpense = async (id, expense) => {
    const response = await api.put(`/expense/${id}`, expense);
    notifyDataChanged();
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expense/${id}`);
    notifyDataChanged();
    return response.data;
};