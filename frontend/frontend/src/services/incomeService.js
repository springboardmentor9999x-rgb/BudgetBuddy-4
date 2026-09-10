const notifyDataChanged = () => window.dispatchEvent(new CustomEvent("bb:data-changed"));

import api from "./api";

export const addIncome = async (data) => {
    const response = await api.post("/income/", data);
    notifyDataChanged();
    return response.data;
};

export const getIncome = async () => {
    const response = await api.get("/income/");

    return Array.isArray(response.data) ? response.data : [];
};

export const updateIncome = async (id, data) => {
    const response = await api.put(`/income/${id}`, data);
    notifyDataChanged();
    return response.data;
};

export const deleteIncome = async (id) => {
    const response = await api.delete(`/income/${id}`);
    notifyDataChanged();
    return response.data;
};