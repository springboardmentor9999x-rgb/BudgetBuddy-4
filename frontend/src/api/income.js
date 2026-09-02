import api from "./axios";

// =========================================================
// Get All Incomes
// =========================================================
export const getIncomes = async () => {
  const response = await api.get("/incomes/");
  return response.data;
};


// =========================================================
// Create Income
// =========================================================
export const createIncome = async (data) => {
  const response = await api.post(
    "/incomes/",
    data
  );

  return response.data;
};


// =========================================================
// Update Income
// =========================================================
export const updateIncome = async (
  id,
  data
) => {

  try {

    console.log(
      "Updating income:",
      id
    );

    console.log(
      "Update data:",
      data
    );

    const response = await api.put(
      `/incomes/${id}`,
      data
    );

    console.log(
      "Update response:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "UPDATE INCOME ERROR:",
      error
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "Backend response:",
      error?.response?.data
    );

    throw error;
  }
};


// =========================================================
// Delete Income
// =========================================================
export const deleteIncome = async (
  id
) => {

  const response = await api.delete(
    `/incomes/${id}`
  );

  return response.data;
};