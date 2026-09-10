const notifyDataChanged = () => window.dispatchEvent(new CustomEvent("bb:data-changed"));

import api from "./api";

export const getBankAccounts = async () => {
  const response = await api.get("/bank-account/");
  return response.data;
};

export const addBankAccount = async (account) => {
  const response = await api.post("/bank-account/", account);
  notifyDataChanged();
    return response.data;
};

export const updateBankAccount = async (id, account) => {
  const response = await api.put(`/bank-account/${id}`, account);
  notifyDataChanged();
    return response.data;
};

export const deleteBankAccount = async (id) => {
  const response = await api.delete(`/bank-account/${id}`);
  notifyDataChanged();
    return response.data;
};
