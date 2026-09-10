import api from "./api";
import { getIncome } from "./incomeService";
import { getExpense } from "./expenseService";

export const getMonthlyAnalysis = async (year, month, bankId, category) => {
  const params = { year, month };
  if (bankId) params.bank_id = bankId;
  if (category) params.category = category;

  const response = await api.get("/analytics/monthly", { params });
  return response.data;
};

export const getYearlyAnalysis = async (year, bankId, category) => {
  const params = { year };
  if (bankId) params.bank_id = bankId;
  if (category) params.category = category;

  const response = await api.get("/analytics/yearly", { params });
  return response.data;
};

export const getAnalytics = async () => {
  const income = await getIncome();
  const expense = await getExpense();

  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = expense.reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = totalIncome - totalExpense;

  const categoryMap = {};
  expense.forEach((item) => {
    categoryMap[item.category] = (categoryMap[item.category] || 0) + Number(item.amount);
  });

  const pieData = Object.keys(categoryMap).map((key) => ({
    name: key,
    amount: categoryMap[key],
  }));

  const barData = [
    { name: "Income", amount: totalIncome },
    { name: "Expense", amount: totalExpense },
    { name: "Balance", amount: balance },
  ];

  return { totalIncome, totalExpense, balance, pieData, barData };
};
