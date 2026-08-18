import api from "../api/axios";

export const getAnalytics = async () => {
  const [summary, categories, trend, goals] = await Promise.all([
    api.get("/analytics/summary"), api.get("/analytics/spending-by-category"), api.get("/analytics/monthly-trend"), api.get("/analytics/savings-progress"),
  ]);
  return { summary: summary.data, categories: categories.data, trend: trend.data, goals: goals.data };
};

export const downloadReport = async (format, { month, year }) => {
  const response = await api.get(`/reports/export/${format}`, {
    params: { month, year },
    responseType: "blob",
  });
  const disposition = response.headers["content-disposition"] || "";
  const filename = disposition.match(/filename=([^;]+)/i)?.[1]?.replaceAll('"', "")
    || `budgetbuddy-report-${year}-${String(month).padStart(2, "0")}.${format === "pdf" ? "pdf" : "xlsx"}`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
