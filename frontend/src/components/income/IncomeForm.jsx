import { useEffect, useState } from "react";
import api from "../../api/axios";

function IncomeForm({
  onSubmit,
  editingIncome,
  onCancelEdit,
}) {
  const [form, setForm] = useState({
    source: "",
    bank_account_id: "",
    amount: "",
    description: "",
    date: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // -------------------------
  // Load Bank Accounts
  // -------------------------
  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoadingBanks(true);

      const response = await api.get("/bank-accounts/");

      setBankAccounts(response.data);
    } catch (error) {
      console.error(
        "Failed to load bank accounts:",
        error
      );
    } finally {
      setLoadingBanks(false);
    }
  };

  // -------------------------
  // Load Income for Editing
  // -------------------------
  useEffect(() => {
    if (editingIncome) {
      setForm({
        source: editingIncome.source || "",
        bank_account_id:
          editingIncome.bank_account_id
            ? String(editingIncome.bank_account_id)
            : "",
        amount: editingIncome.amount || "",
        description:
          editingIncome.description || "",
        date: editingIncome.date
          ? editingIncome.date.substring(0, 10)
          : "",
      });
    }
  }, [editingIncome]);

  // -------------------------
  // Handle Change
  // -------------------------
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // -------------------------
  // Reset Form
  // -------------------------
  const resetForm = () => {
    setForm({
      source: "",
      bank_account_id: "",
      amount: "",
      description: "",
      date: "",
    });
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.bank_account_id) {
      alert("Please select a bank account.");
      return;
    }

    onSubmit({
      source: form.source,

      bank_account_id: Number(
        form.bank_account_id
      ),

      amount: Number(form.amount),

      description: form.description,

      date: form.date,
    });

    // Clear only when adding
    if (!editingIncome) {
      resetForm();
    }
  };

  // -------------------------
  // Cancel Edit
  // -------------------------
  const handleCancel = () => {
    resetForm();

    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div>
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6">
        {editingIncome
          ? "Edit Income"
          : "Add Income"}
      </h2>

      <form onSubmit={handleSubmit}>

        {/* Income Source */}
        <input
          type="text"
          name="source"
          placeholder="Income Source"
          value={form.source}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Bank Account */}
        <select
          name="bank_account_id"
          value={form.bank_account_id}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loadingBanks}
        >
          <option value="">
            {loadingBanks
              ? "Loading Bank Accounts..."
              : "Select Bank Account"}
          </option>

          {bankAccounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              {account.bank_name} ••••{" "}
              {account.account_number.slice(-4)}
            </option>
          ))}
        </select>

        {/* No Bank Account */}
        {!loadingBanks &&
          bankAccounts.length === 0 && (
            <p className="text-sm text-red-500 mb-4">
              Please add a bank account before
              adding income.
            </p>
          )}

        {/* Amount */}
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0.01"
          step="0.01"
          required
        />

        {/* Description */}
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Date */}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            loadingBanks ||
            bankAccounts.length === 0
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-300"
        >
          {editingIncome
            ? "Update Income"
            : "Add Income"}
        </button>

        {/* Cancel Button */}
        {editingIncome && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition duration-300"
          >
            Cancel
          </button>
        )}

      </form>
    </div>
  );
}

export default IncomeForm;