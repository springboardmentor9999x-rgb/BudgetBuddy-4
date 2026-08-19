import { useEffect, useState } from "react";

import api from "../api/axios";

import ProtectedLayout from "../components/ProtectedLayout";

import SpendingPieChart from "../components/analytics/SpendingPieChart";
import MonthlyTrendLineChart from "../components/analytics/MonthlyTrendLineChart";
import SavingsProgressBar from "../components/analytics/SavingsProgressBar";


function AnalyticsDashboard() {

  // -------------------------
  // Analytics Data
  // -------------------------

  const [spendingData, setSpendingData] =
    useState([]);

  const [monthlyData, setMonthlyData] =
    useState([]);

  const [savingsData, setSavingsData] =
    useState([]);


  // -------------------------
  // Summary
  // -------------------------

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    savings_rate: 0,
  });


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // -------------------------
  // Load Analytics
  // -------------------------

  useEffect(() => {
    loadAnalytics();
  }, []);


  const loadAnalytics = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        spendingResponse,
        monthlyResponse,
        savingsResponse,
        summaryResponse,
      ] = await Promise.all([

        api.get(
          "/analytics/spending-by-category"
        ),

        api.get(
          "/analytics/monthly-trend"
        ),

        api.get(
          "/analytics/savings-progress"
        ),

        api.get(
          "/analytics/summary"
        ),

      ]);


      setSpendingData(
        spendingResponse.data || []
      );


      setMonthlyData(
        monthlyResponse.data || []
      );


      setSavingsData(
        savingsResponse.data || []
      );


      setSummary(
        summaryResponse.data || {
          total_income: 0,
          total_expenses: 0,
          net_balance: 0,
          savings_rate: 0,
        }
      );

    } catch (err) {

      console.error(
        "Analytics error:",
        err
      );


      setError(
        err.response?.data?.detail ||
          "Unable to load analytics."
      );

    } finally {

      setLoading(false);

    }

  };


  // -------------------------
  // Download Report
  // -------------------------

  const downloadFile = async (
    type
  ) => {

    try {

      const currentDate =
        new Date();

      const month =
        currentDate.getMonth() + 1;

      const year =
        currentDate.getFullYear();


      const response =
        await api.get(
          `/reports/export/${type}`,
          {
            params: {
              month,
              year,
            },

            responseType: "blob",
          }
        );


      const blob =
        new Blob(
          [response.data]
        );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement("a");


      link.href = url;


      link.download =
        type === "pdf"
          ? `budgetbuddy_${month}_${year}.pdf`
          : `budgetbuddy_${month}_${year}.xlsx`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        url
      );

    } catch (err) {

      console.error(
        "Download error:",
        err
      );


      alert(
        "Unable to download report."
      );

    }

  };


  // -------------------------
  // Loading
  // -------------------------

  if (loading) {

    return (
      <ProtectedLayout>

        <div className="p-8 text-center">

          <div className="bg-white rounded-2xl shadow-md p-10">

            <p className="text-gray-500 text-lg">
              Loading analytics...
            </p>

          </div>

        </div>

      </ProtectedLayout>
    );

  }


  // -------------------------
  // Error
  // -------------------------

  if (error) {

    return (
      <ProtectedLayout>

        <div className="p-8">

          <div className="bg-red-100 border border-red-200 text-red-700 p-5 rounded-xl">

            <p className="font-semibold">
              Analytics Error
            </p>

            <p className="mt-1">
              {error}
            </p>

          </div>

        </div>

      </ProtectedLayout>
    );

  }


  return (
    <ProtectedLayout>

      <div className="bg-slate-100 min-h-full">


        {/* =================================================
            Header
        ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Track your financial performance
              and spending patterns.
            </p>

          </div>


          {/* Export Buttons */}

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() =>
                downloadFile("pdf")
              }
              className="bg-red-600 hover:bg-red-700
                         text-white px-5 py-2.5
                         rounded-lg font-semibold
                         transition"
            >
              Export PDF
            </button>


            <button
              type="button"
              onClick={() =>
                downloadFile("excel")
              }
              className="bg-green-600 hover:bg-green-700
                         text-white px-5 py-2.5
                         rounded-lg font-semibold
                         transition"
            >
              Export Excel
            </button>

          </div>

        </div>


        {/* =================================================
            Summary Cards
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">


          {/* Total Income */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Total Income
            </p>

            <h2 className="text-2xl font-bold mt-2 text-green-600">

              ₹
              {Number(
                summary.total_income || 0
              ).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}

            </h2>

          </div>


          {/* Total Expenses */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Total Expenses
            </p>

            <h2 className="text-2xl font-bold mt-2 text-red-600">

              ₹
              {Number(
                summary.total_expenses || 0
              ).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}

            </h2>

          </div>


          {/* Net Balance */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Net Balance
            </p>

            <h2 className="text-2xl font-bold mt-2 text-blue-600">

              ₹
              {Number(
                summary.net_balance || 0
              ).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}

            </h2>

          </div>


          {/* Savings Rate */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Savings Rate
            </p>

            <h2 className="text-2xl font-bold mt-2 text-purple-600">

              {Number(
                summary.savings_rate || 0
              ).toFixed(1)}
              %

            </h2>

          </div>


        </div>


        {/* =================================================
            Charts
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">


          {/* Spending */}

          <div className="bg-white rounded-2xl shadow-md p-5">

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Spending by Category
            </h2>

            <SpendingPieChart
              data={spendingData}
            />

          </div>


          {/* Monthly Trend */}

          <div className="bg-white rounded-2xl shadow-md p-5">

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Monthly Financial Trend
            </h2>

            <MonthlyTrendLineChart
              data={monthlyData}
            />

          </div>


        </div>


        {/* =================================================
            Savings Progress
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Savings Goals Progress
          </h2>

          <SavingsProgressBar
            goals={savingsData}
          />

        </div>


      </div>

    </ProtectedLayout>
  );
}


export default AnalyticsDashboard;