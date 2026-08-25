import { useEffect, useState } from "react";

import {
  FaFileAlt,
  FaDownload,
  FaChartPie,
} from "react-icons/fa";

import api from "../api/axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { useAuth } from "../context/AuthContext";


function Reports() {
  const { user, logout } = useAuth();

  // =========================================================
  // Current Date
  // =========================================================

  const today = new Date();

  // =========================================================
  // Month / Year
  // =========================================================

  const [month, setMonth] = useState(
    today.getMonth() + 1
  );

  const [year, setYear] = useState(
    today.getFullYear()
  );

  // =========================================================
  // Helper: First Day of Month
  // =========================================================

  const getFirstDayOfMonth = (
    selectedYear,
    selectedMonth
  ) => {
    return `${selectedYear}-${String(
      selectedMonth
    ).padStart(2, "0")}-01`;
  };

  // =========================================================
  // Helper: Last Day of Month
  // =========================================================

  const getLastDayOfMonth = (
    selectedYear,
    selectedMonth
  ) => {
    const lastDay = new Date(
      selectedYear,
      selectedMonth,
      0
    ).getDate();

    return `${selectedYear}-${String(
      selectedMonth
    ).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;
  };

  // =========================================================
  // Date Range
  // =========================================================

  const [fromDate, setFromDate] = useState(
    getFirstDayOfMonth(
      today.getFullYear(),
      today.getMonth() + 1
    )
  );

  const [toDate, setToDate] = useState(
    getLastDayOfMonth(
      today.getFullYear(),
      today.getMonth() + 1
    )
  );

  // =========================================================
  // Report State
  // =========================================================

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {
    logout();
  };

  // =========================================================
  // Month Names
  // =========================================================

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // =========================================================
  // Years
  // =========================================================

  const years = [];

  for (
    let y = today.getFullYear();
    y >= 2020;
    y--
  ) {
    years.push(y);
  }

  // =========================================================
  // Change Month
  // =========================================================

  const handleMonthChange = (e) => {
    const newMonth = Number(
      e.target.value
    );

    setMonth(newMonth);

    setFromDate(
      getFirstDayOfMonth(
        year,
        newMonth
      )
    );

    setToDate(
      getLastDayOfMonth(
        year,
        newMonth
      )
    );
  };

  // =========================================================
  // Change Year
  // =========================================================

  const handleYearChange = (e) => {
    const newYear = Number(
      e.target.value
    );

    setYear(newYear);

    setFromDate(
      getFirstDayOfMonth(
        newYear,
        month
      )
    );

    setToDate(
      getLastDayOfMonth(
        newYear,
        month
      )
    );
  };

  // =========================================================
  // Load Monthly Report
  // =========================================================

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/reports/monthly",
        {
          params: {
            month,
            year,
            from_date: fromDate,
            to_date: toDate,
          },
        }
      );

      setReport(response.data);

    } catch (error) {
      console.error(
        "Report Error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to load report."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Load Report When Date Changes
  // =========================================================

  useEffect(() => {
    if (fromDate && toDate) {
      loadReport();
    }
  }, [
    month,
    year,
    fromDate,
    toDate,
  ]);

  // =========================================================
  // Download PDF
  // =========================================================

  const downloadPDF = async () => {
    try {
      setDownloading(true);
      setError("");

      // IMPORTANT:
      // Backend endpoint is /reports/export/pdf
      const response = await api.get(
        "/reports/export/pdf",
        {
          params: {
            month,
            year,
            from_date: fromDate,
            to_date: toDate,
          },

          responseType: "blob",
        }
      );

      // =====================================================
      // Create PDF Blob
      // =====================================================

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      // =====================================================
      // Create Download URL
      // =====================================================

      const url =
        window.URL.createObjectURL(
          blob
        );

      // =====================================================
      // Create Download Link
      // =====================================================

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `BudgetBuddy_Report_${fromDate}_to_${toDate}.pdf`;

      document.body.appendChild(link);

      link.click();

      // =====================================================
      // Cleanup
      // =====================================================

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        "PDF Download Error:",
        error
      );

      setError(
        "Unable to download PDF report."
      );

    } finally {
      setDownloading(false);
    }
  };

  // =========================================================
  // Format Currency
  // =========================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="
        min-h-screen
        bg-slate-100
        flex
      "
    >

      {/* =====================================================
          Sidebar
      ===================================================== */}

      <Sidebar
        onLogout={handleLogout}
      />

      {/* =====================================================
          Main
      ===================================================== */}

      <div
        className="
          flex-1
          flex
          flex-col
          min-w-0
        "
      >

        <Navbar user={user} />

        <main className="p-8">

          {/* =================================================
              Header
          ================================================= */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
              mb-8
            "
          >

            <div>

              <h1
                className="
                  text-3xl
                  font-bold
                  text-gray-900
                "
              >
                Financial Reports
              </h1>

              <p
                className="
                  text-gray-500
                  mt-2
                "
              >
                Generate and download your
                financial statement.
              </p>

            </div>

            {/* Month / Year */}

            <div
              className="
                flex
                gap-3
                flex-wrap
              "
            >

              <select
                value={month}
                onChange={
                  handleMonthChange
                }
                className="
                  bg-white
                  border
                  border-gray-300
                  rounded-xl
                  px-4
                  py-3
                  text-gray-800
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >

                {months.map(
                  (
                    monthName,
                    index
                  ) => (
                    <option
                      key={monthName}
                      value={index + 1}
                    >
                      {monthName}
                    </option>
                  )
                )}

              </select>

              <select
                value={year}
                onChange={
                  handleYearChange
                }
                className="
                  bg-white
                  border
                  border-gray-300
                  rounded-xl
                  px-4
                  py-3
                  text-gray-800
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >

                {years.map(
                  (yearValue) => (
                    <option
                      key={yearValue}
                      value={yearValue}
                    >
                      {yearValue}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          {/* =================================================
              Report Period
          ================================================= */}

          <div
            className="
              bg-white
              rounded-2xl
              shadow-md
              p-6
              mb-6
            "
          >

            <h2
              className="
                text-lg
                font-bold
                text-gray-900
                mb-4
              "
            >
              Report Period
            </h2>

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
                items-end
              "
            >

              {/* From Date */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-600
                    mb-2
                  "
                >
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-xl
                    px-4
                    py-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* To Date */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-600
                    mb-2
                  "
                >
                  To Date
                </label>

                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-xl
                    px-4
                    py-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* Download PDF */}

              <button
                type="button"
                onClick={downloadPDF}
                disabled={
                  downloading ||
                  loading
                }
                className="
                  w-full
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-gray-400
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  py-3
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  gap-2
                  transition
                "
              >

                <FaDownload />

                {downloading
                  ? "Downloading..."
                  : "Download PDF"}

              </button>

            </div>

          </div>

          {/* =================================================
              Error
          ================================================= */}

          {error && (
            <div
              className="
                bg-red-50
                border
                border-red-200
                text-red-600
                rounded-xl
                p-4
                mb-6
              "
            >
              {error}
            </div>
          )}

          {/* =================================================
              Loading
          ================================================= */}

          {loading ? (

            <div
              className="
                bg-white
                rounded-2xl
                shadow-md
                p-10
                text-center
                text-gray-500
              "
            >
              Loading financial report...
            </div>

          ) : report ? (

            <>

              {/* =================================================
                  Report Title
              ================================================= */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-md
                  p-6
                  mb-6
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      bg-blue-100
                      text-blue-600
                      w-14
                      h-14
                      rounded-xl
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <FaFileAlt size={24} />

                  </div>

                  <div>

                    <h2
                      className="
                        text-xl
                        font-bold
                        text-gray-900
                      "
                    >
                      {months[
                        report.month - 1
                      ]}{" "}
                      {report.year} Report
                    </h2>

                    <p
                      className="
                        text-gray-500
                      "
                    >
                      {report.from_date ||
                        fromDate}
                      {" → "}
                      {report.to_date ||
                        toDate}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  Summary Cards
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  xl:grid-cols-4
                  gap-6
                "
              >

                {/* Income */}

                <div
                  className="
                    bg-white
                    rounded-2xl
                    shadow-md
                    p-6
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Total Income
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-green-600
                      mt-2
                    "
                  >
                    {formatCurrency(
                      report.total_income
                    )}
                  </p>

                </div>

                {/* Expenses */}

                <div
                  className="
                    bg-white
                    rounded-2xl
                    shadow-md
                    p-6
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Total Expenses
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-red-600
                      mt-2
                    "
                  >
                    {formatCurrency(
                      report.total_expenses
                    )}
                  </p>

                </div>

                {/* Savings */}

                <div
                  className="
                    bg-white
                    rounded-2xl
                    shadow-md
                    p-6
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Savings
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-blue-600
                      mt-2
                    "
                  >
                    {formatCurrency(
                      report.total_savings
                    )}
                  </p>

                </div>

                {/* Available */}

                <div
                  className="
                    bg-white
                    rounded-2xl
                    shadow-md
                    p-6
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Available Amount
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-purple-600
                      mt-2
                    "
                  >
                    {formatCurrency(
                      report.available_amount
                    )}
                  </p>

                </div>

              </div>

              {/* =================================================
                  Savings Rate
              ================================================= */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-md
                  p-6
                  mt-6
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    items-center
                  "
                >

                  <div>

                    <p
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      Savings Rate
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-gray-900
                        mt-1
                      "
                    >
                      {report.savings_rate}%
                    </p>

                  </div>

                  <div
                    className="
                      w-16
                      h-16
                      rounded-full
                      bg-blue-100
                      text-blue-600
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <FaChartPie size={25} />

                  </div>

                </div>

                <div
                  className="
                    w-full
                    bg-gray-200
                    rounded-full
                    h-3
                    mt-5
                  "
                >

                  <div
                    className="
                      bg-blue-600
                      h-3
                      rounded-full
                      transition-all
                    "
                    style={{
                      width: `${Math.min(
                        Math.max(
                          report.savings_rate,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              {/* =================================================
                  Spending Categories
              ================================================= */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-md
                  p-6
                  mt-6
                "
              >

                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                    mb-6
                  "
                >
                  Spending by Category
                </h2>

                {report
                  .spending_by_category
                  ?.length > 0 ? (

                  <div
                    className="
                      space-y-5
                    "
                  >

                    {report
                      .spending_by_category
                      .map(
                        (item) => {

                          const percentage =
                            report.total_expenses >
                              0
                              ? (
                                (
                                  item.total /
                                  report.total_expenses
                                ) * 100
                              )
                              : 0;

                          return (
                            <div
                              key={
                                item.category
                              }
                            >

                              <div
                                className="
                                  flex
                                  justify-between
                                  mb-2
                                "
                              >

                                <span
                                  className="
                                    font-medium
                                    text-gray-700
                                  "
                                >
                                  {item.category}
                                </span>

                                <span
                                  className="
                                    font-semibold
                                    text-gray-900
                                  "
                                >
                                  {formatCurrency(
                                    item.total
                                  )}
                                </span>

                              </div>

                              <div
                                className="
                                  w-full
                                  bg-gray-200
                                  rounded-full
                                  h-3
                                "
                              >

                                <div
                                  className="
                                    bg-blue-600
                                    h-3
                                    rounded-full
                                  "
                                  style={{
                                    width: `${Math.min(
                                      percentage,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                              <p
                                className="
                                  text-xs
                                  text-gray-500
                                  mt-1
                                "
                              >
                                {percentage.toFixed(
                                  1
                                )}
                                % of total expenses
                              </p>

                            </div>
                          );
                        }
                      )}

                  </div>

                ) : (

                  <div
                    className="
                      text-center
                      py-8
                      text-gray-500
                    "
                  >

                    <FaChartPie
                      size={35}
                      className="
                        mx-auto
                        mb-3
                        text-gray-300
                      "
                    />

                    No expenses recorded
                    for this period.

                  </div>

                )}

              </div>

              {/* =================================================
                  Monthly Summary
              ================================================= */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-md
                  p-6
                  mt-6
                "
              >

                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  Monthly Summary
                </h2>

                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-6
                    mt-5
                  "
                >

                  <div
                    className="
                      bg-green-50
                      rounded-xl
                      p-5
                    "
                  >

                    <p
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      Net Savings
                    </p>

                    <p
                      className="
                        text-2xl
                        font-bold
                        text-green-600
                        mt-2
                    "
                    >
                      {formatCurrency(
                        report.net_savings
                      )}
                    </p>

                  </div>

                  <div
                    className="
                      bg-purple-50
                      rounded-xl
                      p-5
                    "
                  >

                    <p
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      Available After Expenses
                    </p>

                    <p
                      className="
                        text-2xl
                        font-bold
                        text-purple-600
                        mt-2
                      "
                    >
                      {formatCurrency(
                        report.available_amount
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </>

          ) : null}

        </main>

      </div>

    </div>
  );
}


export default Reports;