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

  // =========================================================
  // State
  // =========================================================

  const [incomes, setIncomes] = useState([]);

  const [editingIncome, setEditingIncome] =
    useState(null);


  // =========================================================
  // Error Message Helper
  // =========================================================

  const getErrorMessage = (
    error,
    fallback
  ) => {

    console.error(
      "Income error:",
      error
    );

    const responseData =
      error?.response?.data;

    console.log(
      "Backend response:",
      responseData
    );


    // -------------------------------------------------------
    // FastAPI detail
    // -------------------------------------------------------

    if (responseData?.detail) {

      const detail =
        responseData.detail;


      // Normal string
      if (
        typeof detail === "string"
      ) {

        return detail;
      }


      // FastAPI validation errors
      if (
        Array.isArray(detail)
      ) {

        return detail
          .map((item) => {

            // String error
            if (
              typeof item === "string"
            ) {

              return item;
            }


            // Pydantic error
            if (item?.msg) {

              const location =
                item?.loc
                  ? item.loc.join(" → ")
                  : "";

              return location
                ? `${location}: ${item.msg}`
                : item.msg;
            }


            return JSON.stringify(
              item
            );

          })
          .join("\n");
      }


      // Object error
      if (
        typeof detail === "object"
      ) {

        return JSON.stringify(
          detail,
          null,
          2
        );
      }
    }


    // -------------------------------------------------------
    // Other backend response
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // Axios error
    // -------------------------------------------------------

    if (error?.message) {

      return error.message;
    }


    return fallback;
  };


  // =========================================================
  // Load Incomes on Page Load
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
        Array.isArray(data)
          ? data
          : []
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

    console.log(
      "Editing income:",
      income
    );

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

    // -------------------------------------------------------
    // Make sure an income is selected
    // -------------------------------------------------------

    if (
      !editingIncome ||
      !editingIncome.id
    ) {

      alert(
        "No income selected for editing."
      );

      return;
    }


    // -------------------------------------------------------
    // Validate required values
    // -------------------------------------------------------

    if (
      !formData.source ||
      !formData.source.trim()
    ) {

      alert(
        "Please enter an income source."
      );

      return;
    }


    if (
      !formData.bank_account_id
    ) {

      alert(
        "Please select a bank account."
      );

      return;
    }


    if (
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {

      alert(
        "Please enter a valid amount."
      );

      return;
    }


    if (
      !formData.date
    ) {

      alert(
        "Please select a date."
      );

      return;
    }


    // -------------------------------------------------------
    // Create clean update payload
    // -------------------------------------------------------

    const updateData = {

      source:
        formData.source.trim(),

      bank_account_id:
        Number(
          formData.bank_account_id
        ),

      amount:
        Number(
          formData.amount
        ),

      description:
        formData.description?.trim()
          ? formData.description.trim()
          : null,

      date:
        formData.date,
    };


    console.log(
      "FINAL UPDATE PAYLOAD:",
      updateData
    );


    try {

      await updateIncome(
        editingIncome.id,
        updateData
      );


      // Reload list
      await loadIncomes();


      // Exit edit mode
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

      alert(
        `Unable to update income.\n\n${message}`
      );
    }
  };


  // =========================================================
  // Form Submit
  // =========================================================

  const handleFormSubmit = async (
    formData
  ) => {

    console.log(
      "FORM SUBMITTED:",
      formData
    );


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


      // Clear edit mode if
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
              incomes={
                incomes
              }

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