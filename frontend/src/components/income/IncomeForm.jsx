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


  // =========================================================
  // Load Bank Accounts
  // =========================================================

  useEffect(() => {
    loadBankAccounts();
  }, []);


  const loadBankAccounts = async () => {

    try {

      setLoadingBanks(true);

      const response =
        await api.get("/bank-accounts/");

      setBankAccounts(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Failed to load bank accounts:",
        error
      );

      setBankAccounts([]);

    } finally {

      setLoadingBanks(false);
    }
  };


  // =========================================================
  // Convert Date to YYYY-MM-DD
  // =========================================================

  const formatDateForInput = (value) => {

    if (!value) {
      return "";
    }

    // Already YYYY-MM-DD
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

      return value;
    }

    // ISO datetime
    if (
      typeof value === "string" &&
      value.includes("T")
    ) {

      return value.substring(
        0,
        10
      );
    }

    // Try JavaScript Date
    const parsed =
      new Date(value);

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {

      const year =
        parsed.getFullYear();

      const month =
        String(
          parsed.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          parsed.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return "";
  };


  // =========================================================
  // Load Income for Editing
  // =========================================================

  useEffect(() => {

    if (!editingIncome) {
      return;
    }

    console.log(
      "Income selected for editing:",
      editingIncome
    );


    const editDate =
      formatDateForInput(
        editingIncome.date
      );


    setForm({

      source:
        editingIncome.source || "",

      bank_account_id:
        editingIncome.bank_account_id !== null &&
          editingIncome.bank_account_id !== undefined
          ? String(
            editingIncome.bank_account_id
          )
          : "",

      amount:
        editingIncome.amount !== null &&
          editingIncome.amount !== undefined
          ? String(
            editingIncome.amount
          )
          : "",

      description:
        editingIncome.description || "",

      date:
        editDate,
    });

  }, [editingIncome]);


  // =========================================================
  // Handle Change
  // =========================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =========================================================
  // Reset Form
  // =========================================================

  const resetForm = () => {

    setForm({

      source: "",

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


    // -------------------------------------------------------
    // Validate Source
    // -------------------------------------------------------

    if (!form.source.trim()) {

      alert(
        "Please enter an income source."
      );

      return;
    }


    // -------------------------------------------------------
    // Validate Bank Account
    // -------------------------------------------------------

    if (!form.bank_account_id) {

      alert(
        "Please select a bank account."
      );

      return;
    }


    // -------------------------------------------------------
    // Validate Amount
    // -------------------------------------------------------

    const amount =
      Number(form.amount);

    if (
      !form.amount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      alert(
        "Please enter a valid amount."
      );

      return;
    }


    // -------------------------------------------------------
    // Validate Date
    // -------------------------------------------------------

    if (!form.date) {

      alert(
        "Please select a date."
      );

      return;
    }


    // Make absolutely sure the date
    // is YYYY-MM-DD
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(
        form.date
      );

    if (!validDate) {

      alert(
        "Please select a valid date."
      );

      return;
    }


    // -------------------------------------------------------
    // Create Clean Payload
    // -------------------------------------------------------

    const data = {

      source:
        form.source.trim(),

      bank_account_id:
        Number(
          form.bank_account_id
        ),

      amount:
        amount,

      description:
        form.description.trim()
          ? form.description.trim()
          : null,

      date:
        form.date,
    };


    console.log(
      "INCOME FORM PAYLOAD:",
      data
    );


    // -------------------------------------------------------
    // Send to Parent
    // -------------------------------------------------------

    onSubmit(data);


    // Only reset when creating
    if (!editingIncome) {

      resetForm();
    }
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

      <h2 className="text-2xl font-bold mb-6">

        {editingIncome
          ? "Edit Income"
          : "Add Income"}

      </h2>


      <form onSubmit={handleSubmit}>

        {/* =================================================
            Income Source
        ================================================= */}

        <input
          type="text"
          name="source"
          placeholder="Income Source"
          value={form.source}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />


        {/* =================================================
            Bank Account
        ================================================= */}

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


          {bankAccounts.map(
            (account) => (

              <option
                key={account.id}
                value={account.id}
              >

                {account.bank_name}
                {" •••• "}
                {account.account_number
                  ? account.account_number.slice(-4)
                  : "****"}

              </option>
            )
          )}

        </select>


        {/* =================================================
            No Bank Account
        ================================================= */}

        {!loadingBanks &&
          bankAccounts.length === 0 && (

            <p className="text-sm text-red-500 mb-4">

              Please add a bank account before
              adding income.

            </p>
          )}


        {/* =================================================
            Amount
        ================================================= */}

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


        {/* =================================================
            Description
        ================================================= */}

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />


        {/* =================================================
            Date
        ================================================= */}

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-300"
        >

          {editingIncome
            ? "Update Income"
            : "Add Income"}

        </button>


        {/* =================================================
            Cancel
        ================================================= */}

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