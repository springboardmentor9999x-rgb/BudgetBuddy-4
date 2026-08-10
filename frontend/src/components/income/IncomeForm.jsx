import { useEffect, useState } from "react";

function IncomeForm({
  onSubmit,
  editingIncome,
  onCancelEdit,
}) {
  const [form, setForm] = useState({
    source: "",
    bank_name: "",
    amount: "",
    description: "",
    date: "",
  });

  // -------------------------
  // Load Income for Editing
  // -------------------------
  useEffect(() => {
    if (editingIncome) {
      setForm({
        source: editingIncome.source || "",
        bank_name: editingIncome.bank_name || "",
        amount: editingIncome.amount || "",
        description: editingIncome.description || "",
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
      bank_name: "",
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

    onSubmit({
      ...form,
      amount: Number(form.amount),
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
    <div className="bg-white rounded-2xl shadow-md p-6">

      {/* Title */}
      <h2 className="text-2xl font-bold mb-6">
        {editingIncome ? "Edit Income" : "Add Income"}
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

        {/* Bank Name */}
        <select
          name="bank_name"
          value={form.bank_name}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">
            Select Bank
          </option>

          <option value="State Bank of India">
            State Bank of India
          </option>

          <option value="HDFC Bank">
            HDFC Bank
          </option>

          <option value="ICICI Bank">
            ICICI Bank
          </option>

          <option value="Axis Bank">
            Axis Bank
          </option>

          <option value="Punjab National Bank">
            Punjab National Bank
          </option>

          <option value="Bank of Baroda">
            Bank of Baroda
          </option>

          <option value="Canara Bank">
            Canara Bank
          </option>

          <option value="Kotak Mahindra Bank">
            Kotak Mahindra Bank
          </option>

          <option value="Union Bank of India">
            Union Bank of India
          </option>

          <option value="IDFC FIRST Bank">
            IDFC FIRST Bank
          </option>

          <option value="Other">
            Other
          </option>
        </select>

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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300"
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