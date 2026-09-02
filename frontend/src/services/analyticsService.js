import api from "../api/axios";

export const getAnalytics = async ({ month, year }) => {
  const [report, trend] = await Promise.all([
    api.get("/reports/monthly", { params: { month, year } }),
    api.get("/analytics/monthly-trend"),
  ]);
  return {
    ...report.data,
    categories: report.data.spending_by_category,
    goals: report.data.savings_progress,
    trend: trend.data,
  };
};

export const getMonthlyReport = async ({ month, year }) => (
  await api.get("/reports/monthly", { params: { month, year } })
).data;

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
