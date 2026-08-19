import { useEffect, useState } from "react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expense";

import ProtectedLayout from "../components/ProtectedLayout";

import ExpenseHeader from "../components/expense/ExpenseHeader";
import ExpenseStats from "../components/expense/ExpenseStats";
import ExpenseForm from "../components/expense/ExpenseForm";
import ExpenseTable from "../components/expense/ExpenseTable";
import EmptyExpense from "../components/expense/EmptyExpense";


function Expense() {
  const [expenses, setExpenses] = useState([]);

  // Currently editing expense
  const [editingExpense, setEditingExpense] = useState(null);


  // =========================================================
  // Error Message Helper
  // =========================================================

  const getErrorMessage = (error, defaultMessage) => {
    console.error("API Error:", error);

    const data = error?.response?.data;


    // =======================================================
    // FastAPI validation errors
    // =======================================================

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => {
          const location = item?.loc
            ? item.loc.join(" → ")
            : "unknown field";

          const message =
            item?.msg ||
            "Validation error";

          return `${location}: ${message}`;
        })
        .join("\n");
    }


    // =======================================================
    // Normal FastAPI detail
    // =======================================================

    if (typeof data?.detail === "string") {
      return data.detail;
    }


    // =======================================================
    // Object detail
    // =======================================================

    if (
      data?.detail &&
      typeof data.detail === "object"
    ) {
      return (
        data.detail.message ||
        JSON.stringify(data.detail)
      );
    }


    // =======================================================
    // Normal message
    // =======================================================

    if (typeof data?.message === "string") {
      return data.message;
    }


    // =======================================================
    // Plain response
    // =======================================================

    if (typeof data === "string") {
      return data;
    }


    // =======================================================
    // Axios error
    // =======================================================

    if (error?.message) {
      return error.message;
    }


    return defaultMessage;
  };


  // =========================================================
  // Load Expenses
  // =========================================================

  useEffect(() => {
    loadExpenses();
  }, []);


  const loadExpenses = async () => {
    try {
      const data = await getExpenses();

      setExpenses(data || []);

    } catch (error) {
      console.error(
        "Failed to load expenses:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to load expenses."
        )
      );
    }
  };


  // =========================================================
  // Create Expense
  // =========================================================

  const handleCreateExpense = async (formData) => {
    try {
      await createExpense(formData);

      await loadExpenses();

      alert(
        "Expense added successfully."
      );

    } catch (error) {
      console.error(
        "Failed to create expense:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to create expense."
        )
      );
    }
  };


  // =========================================================
  // Start Editing
  // =========================================================

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // =========================================================
  // Update Expense
  // =========================================================

  const handleUpdateExpense = async (formData) => {
    if (!editingExpense) {
      return;
    }

    try {
      console.log(
        "Updating expense:",
        editingExpense.id
      );

      console.log(
        "Update data:",
        formData
      );

      await updateExpense(
        editingExpense.id,
        formData
      );

      await loadExpenses();

      setEditingExpense(null);

      alert(
        "Expense updated successfully."
      );

    } catch (error) {
      console.error(
        "Failed to update expense:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to update expense."
        )
      );
    }
  };


  // =========================================================
  // Form Submit
  // =========================================================

  const handleFormSubmit = async (formData) => {
    if (editingExpense) {
      await handleUpdateExpense(formData);
    } else {
      await handleCreateExpense(formData);
    }
  };


  // =========================================================
  // Cancel Edit
  // =========================================================

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };


  // =========================================================
  // Delete Expense
  // =========================================================

  const handleDeleteExpense = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteExpense(id);

      await loadExpenses();

      if (editingExpense?.id === id) {
        setEditingExpense(null);
      }

      alert(
        "Expense deleted successfully."
      );

    } catch (error) {
      console.error(
        "Failed to delete expense:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to delete expense."
        )
      );
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <ProtectedLayout>

      {/* Header */}
      <ExpenseHeader />


      {/* Statistics */}
      <div className="mb-8">
        <ExpenseStats
          expenses={expenses}
        />
      </div>


      {/* Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* =================================================
            Expense Form
        ================================================= */}

        <div className="lg:col-span-1">

          <ExpenseForm
            onSubmit={handleFormSubmit}
            editingExpense={editingExpense}
            onCancelEdit={handleCancelEdit}
          />

        </div>


        {/* =================================================
            Expense Table
        ================================================= */}

        <div className="lg:col-span-2">

          {expenses.length === 0 ? (

            <EmptyExpense />

          ) : (

            <ExpenseTable
              expenses={expenses}
              onDelete={handleDeleteExpense}
              onEdit={handleEditExpense}
            />

          )}

        </div>

      </div>

    </ProtectedLayout>
  );
}


export default Expense;