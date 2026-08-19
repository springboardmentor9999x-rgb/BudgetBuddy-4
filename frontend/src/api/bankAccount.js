import api from "./axios";

// -------------------------
// Get All Bank Accounts
// -------------------------
export const getBankAccounts = async () => {
  const response = await api.get("/bank-accounts/");
  return response.data;
};


// -------------------------
// Get Single Bank Account
// -------------------------
export const getBankAccount = async (id) => {
  const response = await api.get(
    `/bank-accounts/${id}`
  );

  return response.data;
};


// -------------------------
// Create Bank Account
// -------------------------
export const createBankAccount = async (data) => {
  const response = await api.post(
    "/bank-accounts/",
    data
  );

  return response.data;
};


// -------------------------
// Update Bank Account
// -------------------------
export const updateBankAccount = async (
  id,
  data
) => {
  const response = await api.put(
    `/bank-accounts/${id}`,
    data
  );

  return response.data;
};


// -------------------------
// Delete Bank Account
// -------------------------
export const deleteBankAccount = async (id) => {
  const response = await api.delete(
    `/bank-accounts/${id}`
  );

  return response.data;
};