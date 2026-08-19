import { useEffect, useState } from "react";
import api from "../../api/axios";


function ExpenseForm({
  onSubmit,
  editingExpense,
  onCancelEdit,
}) {
  const [form, setForm] = useState({
    category: "",
    payment_method: "",
    bank_account_id: "",
    amount: "",
    description: "",
    date: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);


  // =========================================================
  // Load Bank Accounts
  // =========================================================

  useEffect(() => {
    loadBankAccounts();
  }, []);


  const loadBankAccounts = async () => {
    try {
      setLoadingBanks(true);

      const response = await api.get(
        "/bank-accounts/"
      );

      setBankAccounts(response.data || []);

    } catch (error) {
      console.error(
        "Failed to load bank accounts:",
        error
      );
    } finally {
      setLoadingBanks(false);
    }
  };


  // =========================================================
  // Load Expense For Editing
  // =========================================================

  useEffect(() => {
    if (editingExpense) {
      setForm({
        category:
          editingExpense.category || "",

        payment_method:
          editingExpense.payment_method || "",

        bank_account_id:
          editingExpense.bank_account_id
            ? String(
                editingExpense.bank_account_id
              )
            : "",

        amount:
          editingExpense.amount ?? "",

        description:
          editingExpense.description || "",

        date:
          editingExpense.date
            ? String(
                editingExpense.date
              ).substring(0, 10)
            : "",
      });
    }
  }, [editingExpense]);


  // =========================================================
  // Handle Change
  // =========================================================

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  // =========================================================
  // Reset Form
  // =========================================================

  const resetForm = () => {
    setForm({
      category: "",
      payment_method: "",
      bank_account_id: "",
      amount: "",
      description: "",
      date: "",
    });
  };


  // =========================================================
  // Submit
  // =========================================================

  const handleSubmit = (e) => {
    e.preventDefault();


    if (!form.bank_account_id) {
      alert(
        "Please select a bank account."
      );
      return;
    }


    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    if (!editingExpense) {

      const createData = {
        category: form.category,

        payment_method:
          form.payment_method,

        bank_account_id:
          Number(form.bank_account_id),

        amount:
          Number(form.amount),

        description:
          form.description || null,

        date:
          form.date,
      };


      console.log(
        "Creating expense:",
        createData
      );


      onSubmit(createData);

      resetForm();

      return;
    }


    // -------------------------------------------------------
    // UPDATE
    //
    // IMPORTANT:
    // Do NOT send date during update because the current
    // backend is rejecting the date field with:
    //
    // body → date: Input should be None
    // -------------------------------------------------------

    const updateData = {
      category: form.category,

      payment_method:
        form.payment_method,

      bank_account_id:
        Number(form.bank_account_id),

      amount:
        Number(form.amount),

      description:
        form.description || null,
    };


    console.log(
      "Updating expense:",
      editingExpense.id
    );

    console.log(
      "Update data:",
      updateData
    );


    onSubmit(updateData);
  };


  // =========================================================
  // Cancel Edit
  // =========================================================

  const handleCancel = () => {
    resetForm();

    if (onCancelEdit) {
      onCancelEdit();
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <div>

      {/* Title */}

      <h2 className="text-2xl font-bold mb-6">
        {editingExpense
          ? "Edit Expense"
          : "Add Expense"}
      </h2>


      <form onSubmit={handleSubmit}>


        {/* =================================================
            Category
        ================================================= */}

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4"
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


        {/* =================================================
            Payment Method
        ================================================= */}

        <select
          name="payment_method"
          value={form.payment_method}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4"
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


        {/* =================================================
            Bank Account
        ================================================= */}

        <select
          name="bank_account_id"
          value={form.bank_account_id}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4"
          required
          disabled={loadingBanks}
        >
          <option value="">
            {loadingBanks
              ? "Loading Bank Accounts..."
              : "Select Bank Account"}
          </option>

          {bankAccounts.map(
            (account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.bank_name} ••••{" "}
                {account.account_number.slice(-4)}
              </option>
            )
          )}
        </select>


        {!loadingBanks &&
          bankAccounts.length === 0 && (
            <p className="text-sm text-red-500 mb-4">
              Please add a bank account before
              adding an expense.
            </p>
          )}


        {/* =================================================
            Amount
        ================================================= */}

        <input
          type="number"
          name="amount"
          placeholder="Expense Amount"
          value={form.amount}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4"
          min="0.01"
          step="0.01"
          required
        />


        {/* =================================================
            Description
        ================================================= */}

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4"
        />


        {/* =================================================
            Date
        ================================================= */}

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-6"
          required
        />


        {/* =================================================
            Submit
        ================================================= */}

        <button
          type="submit"
          disabled={
            loadingBanks ||
            bankAccounts.length === 0
          }
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
        >
          {editingExpense
            ? "Update Expense"
            : "Add Expense"}
        </button>


        {/* =================================================
            Cancel
        ================================================= */}

        {editingExpense && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            Cancel
          </button>
        )}

      </form>
    </div>
  );
}


export default ExpenseForm;