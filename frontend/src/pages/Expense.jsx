import { useEffect, useState } from "react";
import { toast } from "../utils/notifications";

import "../styles/expense.css";

import {
    addExpense,
    getExpense,
    updateExpense,
    deleteExpense
} from "../services/expenseService";

import { getBankAccounts } from "../services/bankAccountService";
import { formatMoney, getCurrencyMeta, getAppSettings, convertCurrency, convertToINR } from "../utils/settings";

const EXPENSE_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Miscellaneous",
];

function Expense() {
    const user = JSON.parse(localStorage.getItem("user"));
    const currency = getAppSettings().currency || "INR";
    const currencyMeta = getCurrencyMeta(currency);

    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [bankAccountId, setBankAccountId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Bank");

    const [list, setList] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    /* =========================
       LOAD BANK ACCOUNTS
    ========================= */
    const loadBankAccounts = async () => {
        try {
            const data = await getBankAccounts();
            setBankAccounts(data);
        } catch (error) {
            console.log(error);
        }
    };

    /* =========================
       LOAD EXPENSE
    ========================= */
    const loadExpense = async () => {
        if (!user) {
            toast.error("Please login again.");
            return;
        }

        try {
            setLoading(true);

            const data = await getExpense();

            setList(data);
        } catch (error) {
            console.log(error);
            toast.error("Unable to load expenses");
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       INITIAL LOAD
    ========================= */
    useEffect(() => {
        if (user) {
            loadExpense();
            loadBankAccounts();
        }
    }, []);

    /* =========================
       RESET FORM
    ========================= */
    const resetForm = () => {
        setCategory("");
        setAmount("");
        setDescription("");
        setBankAccountId("");
        setPaymentMethod("Bank");
        setEditingId(null);
    };

    /* =========================
       ADD / UPDATE EXPENSE
    ========================= */
    const submit = async (e) => {
        e.preventDefault();

        if (!category) {
            toast.error("Please choose a category");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error("Amount must be greater than zero");
            return;
        }

        if (paymentMethod === "Bank" && !bankAccountId) {
            toast.warning(
                bankAccounts.length
                    ? "Please select a bank account, or choose a different payment method."
                    : "Please add a bank account, or choose a different payment method."
            );
            return;
        }

        const payload = {
            // The form uses the selected display currency; the API stores INR.
            amount: convertToINR(amount, currency),
            category,
            description: description.trim(),
            bank_account_id: paymentMethod === "Bank" ? Number(bankAccountId) : null,
            payment_method: paymentMethod,
        };

        try {
            setSubmitting(true);

            if (editingId) {
                await updateExpense(editingId, payload);
                toast.success("Expense updated successfully");
            } else {
                await addExpense(payload);
                toast.success("Expense added successfully");
            }

            resetForm();
            await loadExpense();
        } catch (error) {
            console.log(error);
            toast.error(
                error.response?.data?.detail ||
                (editingId ? "Unable to update expense" : "Unable to add expense")
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* =========================
       START EDIT
    ========================= */
    const startEdit = (item) => {
        setEditingId(item.id);
        setCategory(item.category || "");
        setAmount(
            item.amount == null
                ? ""
                : String(Number(convertCurrency(item.amount, currency).toFixed(2)))
        );
        setDescription(item.description || "");
        setBankAccountId(
            item.bank_account_id ? String(item.bank_account_id) : ""
        );
        setPaymentMethod(item.payment_method || "Bank");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* =========================
       DELETE EXPENSE
    ========================= */
    const remove = async (id) => {
        if (!window.confirm("Delete this expense?")) return;

        try {
            await deleteExpense(id);

            toast.success("Expense deleted successfully");

            if (editingId === id) {
                resetForm();
            }

            await loadExpense();
        } catch (error) {
            console.log(error);
            toast.error("Unable to delete expense");
        }
    };

    /* =========================
       BANK NAME HELPER
    ========================= */
    const getBankName = (bankId) => {
        if (!bankId) return null;

        const bank = bankAccounts.find(
            (account) => account.id === Number(bankId)
        );

        return bank?.bank_name || `Account #${bankId}`;
    };

    /* =========================
       DATE HELPER
    ========================= */
    const formatDate = (value) => {
        if (!value) return "—";

        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime())) return "—";

        return parsed.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /* =========================
       TOTAL EXPENSE
    ========================= */
    const totalExpense = list.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
    );

    return (
        <main className="expense-page">

            {/* =========================
                PAGE HEADER
            ========================= */}
            <section className="expense-page-header">

                <div>
                    <div className="expense-eyebrow">
                        <span>↓</span>
                        FINANCIAL OVERVIEW
                    </div>

                    <h1>Expense</h1>

                    <p>
                        Track your spending, manage categories, and keep
                        your expenses organized.
                    </p>
                </div>

                <div className="expense-summary-badge">
                    <div className="expense-summary-icon">{getCurrencyMeta(getAppSettings().currency).symbol}</div>

                    <div>
                        <span>Total Expense</span>
                        <strong>
                            {formatMoney(totalExpense)}
                        </strong>
                    </div>
                </div>

            </section>


            {/* =========================
                ADD / EDIT EXPENSE CARD
            ========================= */}
            <section className="expense-create-card">

                <div className="expense-card-heading">

                    <div className="expense-create-icon">
                        {editingId ? "✎" : "+"}
                    </div>

                    <div>
                        <h2>
                            {editingId ? "Edit Expense" : "Add New Expense"}
                        </h2>

                        <p>
                            Record purchases, bills, and other spending
                            against a bank account.
                        </p>
                    </div>

                </div>


                <form className="expense-form" onSubmit={submit}>

                    {/* CATEGORY */}
                    <div className="expense-field">

                        <label>
                            Category
                        </label>

                        <div className="expense-select-wrapper">
                            <select
                                value={category}
                                onChange={(e) =>
                                    setCategory(e.target.value)
                                }
                            >
                                <option value="">
                                    Select category
                                </option>

                                {EXPENSE_CATEGORIES.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>


                    {/* AMOUNT */}
                    <div className="expense-field">

                        <label>
                            Amount ({currencyMeta.symbol} {currency})
                        </label>

                        <div className="expense-input-with-symbol">

                            <span>{currencyMeta.symbol}</span>

                            <input
                                type="number"
                                min="1"
                                placeholder="5000"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value)
                                }
                            />

                        </div>

                    </div>


                    {/* PAYMENT METHOD */}
                    <div className="expense-field">

                        <label>
                            Payment Method
                        </label>

                        <div className="expense-select-wrapper">
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="Bank">Bank</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                <option value="Wallet">Wallet</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                    </div>


                    {/* BANK */}
                    <div className="expense-field">

                        <label>
                            Bank Account {paymentMethod !== "Bank" && "(optional)"}
                        </label>

                        <div className="expense-select-wrapper">
                            <select
                                value={bankAccountId}
                                onChange={(e) =>
                                    setBankAccountId(e.target.value)
                                }
                            >
                                <option value="">
                                    Select bank account
                                </option>

                                {bankAccounts.map((acc) => (
                                    <option
                                        key={acc.id}
                                        value={acc.id}
                                    >
                                        {acc.bank_name} (
                                        {acc.masked_account_number}
                                        )
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>


                    {/* DESCRIPTION */}
                    <div className="expense-field">

                        <label>
                            Description
                        </label>

                        <input
                            type="text"
                            placeholder="Groceries, rent, tuition..."
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />

                    </div>


                    {/* SUBMIT */}
                    <div className="expense-submit-area">

                        <button
                            type="submit"
                            className="expense-add-button"
                            disabled={submitting}
                        >
                            {submitting ? (
                                editingId ? "Saving..." : "Adding..."
                            ) : editingId ? (
                                "Save Changes"
                            ) : (
                                <>
                                    <span>+</span>
                                    Add Expense
                                </>
                            )}
                        </button>

                    </div>

                </form>

                {editingId && (
                    <div className="expense-info-card" style={{ marginTop: 20 }}>
                        <div className="expense-info-icon">i</div>
                        <div>
                            <strong>Editing expense #{editingId}</strong>
                            <p>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        color: "#635bff",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel editing
                                </button>{" "}
                                to add a new expense instead.
                            </p>
                        </div>
                    </div>
                )}

            </section>


            {/* =========================
                EXPENSE LIST
            ========================= */}
            <section className="expense-list-card">

                <div className="expense-list-header">

                    <div>
                        <h2>Expense History</h2>

                        <p>
                            View and manage all your recorded expenses.
                        </p>
                    </div>

                    <div className="expense-count">
                        {list.length}
                    </div>

                </div>


                {loading ? (

                    <div className="expense-empty">
                        <div className="expense-empty-icon">…</div>
                        <h3>Loading expenses...</h3>
                        <p>Please wait while we fetch your records.</p>
                    </div>

                ) : list.length === 0 ? (

                    <div className="expense-empty">

                        <div className="expense-empty-icon">
                            {getCurrencyMeta(getAppSettings().currency).symbol}
                        </div>

                        <h3>No expenses found</h3>

                        <p>
                            Add your first expense above to start
                            tracking your spending.
                        </p>

                    </div>

                ) : (

                    <div className="expense-table-wrapper">

                        <table className="expense-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Bank</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>

                            </thead>

                            <tbody>

                                {list.map((item) => (

                                    <tr key={item.id}>

                                        <td>
                                            <span className="expense-id">
                                                #{item.id}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="expense-category">
                                                {item.category || "Miscellaneous"}
                                            </span>
                                        </td>

                                        <td className="expense-description">
                                            {item.description || "—"}
                                        </td>

                                        <td>
                                            <span className="expense-amount">
                                                -{formatMoney(item.amount)}
                                            </span>
                                        </td>

                                        <td>
                                            {getBankName(item.bank_account_id) ? (
                                                <span className="expense-bank">
                                                    {getBankName(item.bank_account_id)}
                                                </span>
                                            ) : (
                                                <span className="expense-unlinked">
                                                    Unlinked
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <span className="expense-date">
                                                {formatDate(item.transaction_date)}
                                            </span>
                                        </td>

                                        <td>

                                            <div style={{ display: "flex", gap: 8 }}>

                                                <button
                                                    type="button"
                                                    className="expense-delete-button"
                                                    style={{
                                                        borderColor: "#dce1eb",
                                                        background: "#f8f9fc",
                                                        color: "#374151",
                                                    }}
                                                    onClick={() => startEdit(item)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="expense-delete-button"
                                                    onClick={() =>
                                                        remove(item.id)
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </main>
    );
}

export default Expense;
