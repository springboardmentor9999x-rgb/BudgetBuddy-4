const notifyDataChanged = () => window.dispatchEvent(new CustomEvent("bb:data-changed"));

import api from "./api";

export const addBudget = async (budget) => {
    const response = await api.post("/budget/", budget);
    notifyDataChanged();
    return response.data;
};

export const getBudget = async (year) => {
    const url = year ? `/budget/?year=${encodeURIComponent(year)}` : "/budget/";
    const response = await api.get(url);
    return response.data;
};

export const updateBudget = async (id, budget) => {
    const response = await api.put(`/budget/${id}`, budget);
    notifyDataChanged();
    return response.data;
};

export const deleteBudget = async (id) => {
    const response = await api.delete(`/budget/${id}`);
    notifyDataChanged();
    return response.data;
};
