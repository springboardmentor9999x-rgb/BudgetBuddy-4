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

  useEffect(() => {
    loadExpenses();
  }, []);

  // -------------------------
  // Load Expenses
  // -------------------------
  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to load expenses."
      );
    }
  };

  // -------------------------
  // Create Expense
  // -------------------------
  const handleCreateExpense = async (formData) => {
    try {
      await createExpense(formData);

      await loadExpenses();

      alert("Expense added successfully.");

    } catch (error) {
      console.error("Failed to create expense:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to create expense."
      );
    }
  };

  // -------------------------
  // Start Editing
  // -------------------------
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);

    // Scroll to the form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -------------------------
  // Update Expense
  // -------------------------
  const handleUpdateExpense = async (formData) => {
    if (!editingExpense) {
      return;
    }

    try {
      await updateExpense(
        editingExpense.id,
        formData
      );

      await loadExpenses();

      setEditingExpense(null);

      alert("Expense updated successfully.");

    } catch (error) {
      console.error("Failed to update expense:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to update expense."
      );
    }
  };

  // -------------------------
  // Form Submit
  // -------------------------
  const handleFormSubmit = async (formData) => {
    if (editingExpense) {
      await handleUpdateExpense(formData);
    } else {
      await handleCreateExpense(formData);
    }
  };

  // -------------------------
  // Cancel Edit
  // -------------------------
  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  // -------------------------
  // Delete Expense
  // -------------------------
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

      // If deleted item was being edited
      if (editingExpense?.id === id) {
        setEditingExpense(null);
      }

      alert("Expense deleted successfully.");

    } catch (error) {
      console.error("Failed to delete expense:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to delete expense."
      );
    }
  };

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

        {/* Expense Form */}
        <div className="lg:col-span-1">

          <ExpenseForm
            onSubmit={handleFormSubmit}
            editingExpense={editingExpense}
            onCancelEdit={handleCancelEdit}
          />

        </div>

        {/* Expense Table */}
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