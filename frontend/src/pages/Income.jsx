import { useEffect, useState } from "react";

import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../api/income";

import ProtectedLayout from "../components/ProtectedLayout";

import IncomeHeader from "../components/income/IncomeHeader";
import IncomeStats from "../components/income/IncomeStats";
import IncomeForm from "../components/income/IncomeForm";
import IncomeTable from "../components/income/IncomeTable";
import EmptyIncome from "../components/income/EmptyIncome";


function Income() {

  const [incomes, setIncomes] = useState([]);

  // Currently editing income
  const [editingIncome, setEditingIncome] =
    useState(null);


  // =========================================================
  // Error Message Helper
  // =========================================================

  const getErrorMessage = (error, fallback) => {

    console.error("Income error:", error);

    const responseData =
      error?.response?.data;

    // FastAPI detail
    if (responseData?.detail) {

      const detail =
        responseData.detail;

      // Normal string
      if (typeof detail === "string") {
        return detail;
      }

      // Validation error array
      if (Array.isArray(detail)) {

        return detail
          .map((item) => {

            if (typeof item === "string") {
              return item;
            }

            if (item?.msg) {
              return item.msg;
            }

            return JSON.stringify(item);
          })
          .join("\n");
      }

      // Object
      if (typeof detail === "object") {

        return JSON.stringify(
          detail,
          null,
          2
        );
      }
    }


    // Backend returned another object
    if (
      responseData &&
      typeof responseData === "object"
    ) {

      return JSON.stringify(
        responseData,
        null,
        2
      );
    }


    // Normal Axios error
    if (error?.message) {
      return error.message;
    }


    return fallback;
  };


  // =========================================================
  // Load Incomes
  // =========================================================

  useEffect(() => {
    loadIncomes();
  }, []);


  // =========================================================
  // Load All Incomes
  // =========================================================

  const loadIncomes = async () => {

    try {

      const data =
        await getIncomes();

      setIncomes(
        data || []
      );

    } catch (error) {

      const message =
        getErrorMessage(
          error,
          "Failed to load incomes."
        );

      alert(message);
    }
  };


  // =========================================================
  // Create Income
  // =========================================================

  const handleCreateIncome = async (
    formData
  ) => {

    try {

      await createIncome(
        formData
      );

      await loadIncomes();

      alert(
        "Income added successfully."
      );

    } catch (error) {

      const message =
        getErrorMessage(
          error,
          "Failed to create income."
        );

      alert(message);
    }
  };


  // =========================================================
  // Start Editing
  // =========================================================

  const handleEditIncome = (
    income
  ) => {

    setEditingIncome(
      income
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // =========================================================
  // Update Income
  // =========================================================

  const handleUpdateIncome = async (
    formData
  ) => {

    if (!editingIncome) {
      return;
    }


    try {

      await updateIncome(
        editingIncome.id,
        formData
      );

      await loadIncomes();

      setEditingIncome(
        null
      );

      alert(
        "Income updated successfully."
      );

    } catch (error) {

      const message =
        getErrorMessage(
          error,
          "Failed to update income."
        );

      alert(message);
    }
  };


  // =========================================================
  // Form Submit
  // =========================================================

  const handleFormSubmit = async (
    formData
  ) => {

    if (editingIncome) {

      await handleUpdateIncome(
        formData
      );

    } else {

      await handleCreateIncome(
        formData
      );
    }
  };


  // =========================================================
  // Cancel Edit
  // =========================================================

  const handleCancelEdit = () => {

    setEditingIncome(
      null
    );
  };


  // =========================================================
  // Delete Income
  // =========================================================

  const handleDeleteIncome = async (
    id
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this income?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      await deleteIncome(
        id
      );

      await loadIncomes();


      // Clear edit mode if the
      // deleted income was being edited
      if (
        editingIncome?.id === id
      ) {

        setEditingIncome(
          null
        );
      }


      alert(
        "Income deleted successfully."
      );

    } catch (error) {

      const message =
        getErrorMessage(
          error,
          "Failed to delete income."
        );

      alert(message);
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <ProtectedLayout>

      {/* =====================================================
          Header
      ===================================================== */}

      <IncomeHeader />


      {/* =====================================================
          Statistics
      ===================================================== */}

      <div className="mb-8">

        <IncomeStats
          incomes={incomes}
        />

      </div>


      {/* =====================================================
          Form + Table
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-8
        "
      >

        {/* ===================================================
            Income Form
        =================================================== */}

        <div className="lg:col-span-1">

          <IncomeForm
            onSubmit={
              handleFormSubmit
            }
            editingIncome={
              editingIncome
            }
            onCancelEdit={
              handleCancelEdit
            }
          />

        </div>


        {/* ===================================================
            Income Table
        =================================================== */}

        <div className="lg:col-span-2">

          {incomes.length === 0 ? (

            <EmptyIncome />

          ) : (

            <IncomeTable
              incomes={incomes}
              onDelete={
                handleDeleteIncome
              }
              onEdit={
                handleEditIncome
              }
            />

          )}

        </div>

      </div>

    </ProtectedLayout>
  );
}


export default Income;