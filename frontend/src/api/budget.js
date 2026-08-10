import axios from "axios";

const API = "http://127.0.0.1:8000";

// -------------------------
// Get All Budgets
// -------------------------
export const getBudgets = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/budgets/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// -------------------------
// Create Budget
// -------------------------
export const createBudget = async (data) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API}/budgets/`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// -------------------------
// Update Budget
// -------------------------
export const updateBudget = async (id, data) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `${API}/budgets/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// -------------------------
// Delete Budget
// -------------------------
export const deleteBudget = async (id) => {
  const token = localStorage.getItem("token");

  const response = await axios.delete(
    `${API}/budgets/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// -------------------------
// Get Budget Progress
// -------------------------
export const getBudgetProgress = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/budgets/progress`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};