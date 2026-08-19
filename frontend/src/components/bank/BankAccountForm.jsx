import { useEffect, useState } from "react";
import { FaUniversity } from "react-icons/fa";

const initialForm = {
  bank_name: "",
  account_number: "",
  account_type: "Savings",
  opening_balance: "",
};

function BankAccountForm({
  onSubmit,
  editingAccount,
  onCancelEdit,
}) {
  const [form, setForm] = useState(
    initialForm
  );

  const [submitting, setSubmitting] =
    useState(false);

  // -------------------------
  // Load Editing Account
  // -------------------------
  useEffect(() => {
    if (editingAccount) {
      setForm({
        bank_name:
          editingAccount.bank_name || "",

        account_number:
          editingAccount.account_number || "",

        account_type:
          editingAccount.account_type ||
          "Savings",

        opening_balance:
          editingAccount.opening_balance ?? "",
      });
    } else {
      setForm(initialForm);
    }
  }, [editingAccount]);

  // -------------------------
  // Handle Change
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      await onSubmit({
        bank_name: form.bank_name.trim(),

        account_number:
          form.account_number.trim(),

        account_type:
          form.account_type,

        opening_balance:
          Number(form.opening_balance || 0),
      });

      // Clear only when adding
      if (!editingAccount) {
        setForm(initialForm);
      }

    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------
  // Cancel Edit
  // -------------------------
  const handleCancel = () => {
    setForm(initialForm);

    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">

        <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <FaUniversity />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {editingAccount
              ? "Edit Bank Account"
              : "Add Bank Account"}
          </h2>

          <p className="text-sm text-gray-500">
            {editingAccount
              ? "Update your bank account details."
              : "Add a bank account to track your finances."}
          </p>
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        {/* Bank Name */}
        <div className="mb-5">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name
          </label>

          <select
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3
                       bg-white text-gray-900
                       focus:outline-none focus:ring-2
                       focus:ring-blue-500"
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

        </div>

        {/* Account Number */}
        <div className="mb-5">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number
          </label>

          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            placeholder="Enter account number"
            minLength={4}
            maxLength={30}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3
                       text-gray-900
                       focus:outline-none focus:ring-2
                       focus:ring-blue-500"
          />

        </div>

        {/* Account Type */}
        <div className="mb-5">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>

          <select
            name="account_type"
            value={form.account_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3
                       bg-white text-gray-900
                       focus:outline-none focus:ring-2
                       focus:ring-blue-500"
          >
            <option value="Savings">
              Savings Account
            </option>

            <option value="Current">
              Current Account
            </option>

            <option value="Salary">
              Salary Account
            </option>
          </select>

        </div>

        {/* Opening Balance */}
        <div className="mb-6">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opening Balance
          </label>

          <div className="relative">

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              ₹
            </span>

            <input
              type="number"
              name="opening_balance"
              value={form.opening_balance}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-xl
                         pl-9 pr-4 py-3
                         text-gray-900
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />

          </div>

        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700
                     disabled:bg-blue-300
                     text-white font-semibold py-3
                     rounded-xl transition"
        >
          {submitting
            ? "Saving..."
            : editingAccount
            ? "Update Bank Account"
            : "Add Bank Account"}
        </button>

        {/* Cancel */}
        {editingAccount && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="w-full mt-3 bg-gray-100
                       hover:bg-gray-200
                       text-gray-700 font-semibold
                       py-3 rounded-xl transition"
          >
            Cancel
          </button>
        )}

      </form>
    </div>
  );
}

export default BankAccountForm;