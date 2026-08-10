import { useEffect, useState } from "react";

function ExpenseForm({
  onSubmit,
  editingExpense,
  onCancelEdit,
}) {
  const [form, setForm] = useState({
    category: "",
    payment_method: "",
    bank_name: "",
    amount: "",
    description: "",
    date: "",
  });

  // -------------------------
  // Fill form when editing
  // -------------------------
  useEffect(() => {
    if (editingExpense) {
      setForm({
        category: editingExpense.category || "",
        payment_method: editingExpense.payment_method || "",
        bank_name: editingExpense.bank_name || "",
        amount: editingExpense.amount ?? "",
        description: editingExpense.description || "",
        date: editingExpense.date
          ? editingExpense.date.substring(0, 10)
          : "",
      });
    }
  }, [editingExpense]);

  // -------------------------
  // Handle Input Changes
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Amount validation
    if (name === "amount") {
      // Allow empty input
      if (value === "") {
        setForm((prev) => ({
          ...prev,
          amount: "",
        }));
        return;
      }

      // Allow only numbers with maximum 2 decimal places
      if (!/^\d*(\.\d{0,2})?$/.test(value)) {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -------------------------
  // Reset Form
  // -------------------------
  const resetForm = () => {
    setForm({
      category: "",
      payment_method: "",
      bank_name: "",
      amount: "",
      description: "",
      date: "",
    });
  };

  // -------------------------
  // Handle Submit
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    onSubmit({
      ...form,
      amount: amount,
    });

    // Clear form only when adding
    if (!editingExpense) {
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingExpense
            ? "Edit Expense"
            : "Add Expense"}
        </h2>

        <p className="text-gray-500 mt-1">
          {editingExpense
            ? "Update your expense details."
            : "Record a new expense."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Category */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2
                     focus:ring-red-500 focus:border-red-500"
          required
        >
          <option value="">
            Select Category
          </option>

          <option value="Food">
            🍔 Food
          </option>

          <option value="Travel">
            ✈️ Travel
          </option>

          <option value="Shopping">
            🛍 Shopping
          </option>

          <option value="Education">
            📚 Education
          </option>

          <option value="Medical">
            🏥 Medical
          </option>

          <option value="Bills">
            💡 Bills
          </option>

          <option value="Entertainment">
            🎬 Entertainment
          </option>

          <option value="Investment">
            📈 Investment
          </option>

          <option value="Rent">
            🏠 Rent
          </option>

          <option value="Fuel">
            ⛽ Fuel
          </option>

          <option value="Groceries">
            🛒 Groceries
          </option>

          <option value="Other">
            📦 Other
          </option>
        </select>

        {/* Payment Method */}
        <select
          name="payment_method"
          value={form.payment_method}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2
                     focus:ring-red-500 focus:border-red-500"
          required
        >
          <option value="">
            Payment Method
          </option>

          <option value="Cash">
            💵 Cash
          </option>

          <option value="UPI">
            📱 UPI
          </option>

          <option value="Debit Card">
            💳 Debit Card
          </option>

          <option value="Credit Card">
            💳 Credit Card
          </option>

          <option value="Net Banking">
            🏦 Net Banking
          </option>

          <option value="Wallet">
            👛 Wallet
          </option>
        </select>

        {/* Bank */}
        <select
          name="bank_name"
          value={form.bank_name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2
                     focus:ring-red-500 focus:border-red-500"
        >
          <option value="">
            Select Bank (Optional)
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
        <div className="relative mb-4">

          {/* Rupee Symbol */}
          <span
            className="absolute left-4 top-1/2
                       -translate-y-1/2
                       text-gray-500 text-lg font-semibold
                       pointer-events-none"
          >
            ₹
          </span>

          <input
            type="text"
            name="amount"
            placeholder="Expense Amount"
            value={form.amount}
            onChange={handleChange}
            inputMode="decimal"
            className="w-full border border-gray-300 rounded-xl
                       p-4 pl-10
                       text-lg font-medium text-gray-900
                       placeholder-gray-400
                       focus:outline-none focus:ring-2
                       focus:ring-red-500
                       focus:border-red-500
                       transition"
            required
          />

        </div>

        {/* Description */}
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4
                     text-gray-900
                     focus:outline-none focus:ring-2
                     focus:ring-red-500 focus:border-red-500"
        />

        {/* Date */}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 mb-6
                     text-gray-900
                     focus:outline-none focus:ring-2
                     focus:ring-red-500 focus:border-red-500"
          required
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-red-600
                     hover:bg-red-700
                     active:bg-red-800
                     text-white font-semibold
                     py-3 rounded-xl
                     transition duration-300
                     shadow-sm hover:shadow-md"
        >
          {editingExpense
            ? "Update Expense"
            : "Add Expense"}
        </button>

        {/* Cancel Edit */}
        {editingExpense && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full mt-3
                       bg-gray-100 hover:bg-gray-200
                       text-gray-700 font-semibold
                       py-3 rounded-xl
                       transition duration-300"
          >
            Cancel
          </button>
        )}

      </form>

    </div>
  );
}

export default ExpenseForm;