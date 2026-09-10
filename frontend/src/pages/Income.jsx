import { useEffect, useState } from "react";
import { toast } from "../utils/notifications";

import "../styles/income.css";

import {
    addIncome,
    getIncome,
    deleteIncome
} from "../services/incomeService";

import { getBankAccounts } from "../services/bankAccountService";
import { formatMoney, getCurrencyMeta, getAppSettings, convertToINR } from "../utils/settings";

function Income() {
    const user = JSON.parse(localStorage.getItem("user"));
    const currency = getAppSettings().currency || "INR";
    const currencyMeta = getCurrencyMeta(currency);

    const [source, setSource] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [bankAccountId, setBankAccountId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Bank");

    const [list, setList] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
       LOAD INCOME
    ========================= */
    const loadIncome = async () => {
        if (!user) {
            toast.error("Please login again.");
            return;
        }

        try {
            setLoading(true);

            const data = await getIncome();

            setList(data);
        } catch (error) {
            console.log(error);
            toast.error("Unable to load income");
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       INITIAL LOAD
    ========================= */
    useEffect(() => {
        if (user) {
            loadIncome();
            loadBankAccounts();
        }
    }, []);

    /* =========================
       ADD INCOME
    ========================= */
    const submit = async (e) => {
        e.preventDefault();

        if (!source.trim() || !amount) {
            toast.error("Source and Amount are required");
            return;
        }

        if (Number(amount) <= 0) {
            toast.error("Amount must be greater than zero");
            return;
        }

        if (paymentMethod === "Bank" && !bankAccountId) {
            toast.warning(
                bankAccounts.length
                    ? "Please select a bank account, or choose a different payment method."
                    : "Please add and link a bank account, or choose a different payment method."
            );
            return;
        }

        try {
            setSubmitting(true);

            await addIncome({
                source: source.trim(),
                // The form uses the selected display currency; the API stores INR.
                amount: convertToINR(amount, currency),
                category: category.trim(),
                description: description.trim(),
                bank_account_id: paymentMethod === "Bank" ? Number(bankAccountId) : null,
                payment_method: paymentMethod
            });

            toast.success("Income added successfully");

            setSource("");
            setAmount("");
            setCategory("");
            setDescription("");
            setBankAccountId("");
            setPaymentMethod("Bank");

            await loadIncome();
        } catch (error) {
            console.log(error);
            toast.error(
                error.response?.data?.detail ||
                "Unable to add income"
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* =========================
       DELETE INCOME
    ========================= */
    const remove = async (id) => {
        try {
            await deleteIncome(id);

            toast.success("Income deleted successfully");

            await loadIncome();
        } catch (error) {
            console.log(error);
            toast.error("Delete failed");
        }
    };

    /* =========================
       BANK NAME HELPER
    ========================= */
    const getBankName = (bankId) => {
        if (!bankId) return "Unlinked";

        const bank = bankAccounts.find(
            (account) => account.id === Number(bankId)
        );

        return bank?.bank_name || `Account #${bankId}`;
    };

    /* =========================
       TOTAL INCOME
    ========================= */
    const totalIncome = list.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
    );

    return (
        <main className="income-page">

            {/* =========================
                PAGE HEADER
            ========================= */}
            <section className="income-page-header">

                <div>
                    <div className="income-eyebrow">
                        <span>↗</span>
                        FINANCIAL OVERVIEW
                    </div>

                    <h1>Income</h1>

                    <p>
                        Track your earnings, manage your income sources,
                        and keep your finances organized.
                    </p>
                </div>

                <div className="income-total-card">
                    <span>Total Income</span>
                    <strong>
                        {formatMoney(totalIncome)}
                    </strong>
                    <small>
                        {list.length} transaction
                        {list.length !== 1 ? "s" : ""}
                    </small>
                </div>

            </section>


            {/* =========================
                ADD INCOME CARD
            ========================= */}
            <section className="income-create-card">

                <div className="income-card-heading">

                    <div className="income-heading-icon">
                        +
                    </div>

                    <div>
                        <h2>Add New Income</h2>

                        <p>
                            Record your salary, freelance income,
                            business income, or other earnings.
                        </p>
                    </div>

                </div>


                <form onSubmit={submit}>

                    <div className="income-form-grid">

                        {/* SOURCE */}
                        <div className="income-field">

                            <label>
                                Income Source
                            </label>

                            <input
                                type="text"
                                placeholder="Salary, Freelance, Business..."
                                value={source}
                                onChange={(e) =>
                                    setSource(e.target.value)
                                }
                            />

                        </div>


                        {/* AMOUNT */}
                        <div className="income-field">

                            <label>
                                Amount ({currencyMeta.symbol} {currency})
                            </label>

                            <div className="income-input-with-symbol">

                                <span>{currencyMeta.symbol}</span>

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="50000"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* CATEGORY */}
                        <div className="income-field">

                            <label>
                                Category
                            </label>

                            <input
                                type="text"
                                placeholder="Salary, Business, Other..."
                                value={category}
                                onChange={(e) =>
                                    setCategory(e.target.value)
                                }
                            />

                        </div>


                        {/* PAYMENT METHOD */}
                        <div className="income-field">

                            <label>
                                Payment Method
                            </label>

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


                        {/* BANK */}
                        <div className="income-field">

                            <label>
                                Bank Account {paymentMethod !== "Bank" && "(optional)"}
                            </label>

                            <select
                                value={bankAccountId}
                                onChange={(e) =>
                                    setBankAccountId(e.target.value)
                                }
                            >

                                <option value="">
                                    No bank account (unlinked)
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


                        {/* DESCRIPTION */}
                        <div className="income-field income-field-full">

                            <label>
                                Description
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Add a short description..."
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                            />

                        </div>

                    </div>


                    <div className="income-form-actions">

                        <button
                            type="button"
                            className="income-clear-btn"
                            onClick={() => {
                                setSource("");
                                setAmount("");
                                setCategory("");
                                setDescription("");
                                setBankAccountId("");
                            }}
                        >
                            Clear
                        </button>

                        <button
                            type="submit"
                            className="income-add-btn"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="income-spinner" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <span>+</span>
                                    Add Income
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </section>


            {/* =========================
                INCOME LIST
            ========================= */}
            <section className="income-list-card">

                <div className="income-list-header">

                    <div>
                        <h2>Income History</h2>

                        <p>
                            View and manage all your recorded income.
                        </p>
                    </div>

                    <div className="income-count">
                        {list.length} record
                        {list.length !== 1 ? "s" : ""}
                    </div>

                </div>


                {loading ? (

                    <div className="income-empty-state">
                        <div className="income-loading-spinner" />
                        <p>Loading income...</p>
                    </div>

                ) : list.length === 0 ? (

                    <div className="income-empty-state">

                        <div className="income-empty-icon">
                            {getCurrencyMeta(getAppSettings().currency).symbol}
                        </div>

                        <h3>No income recorded yet</h3>

                        <p>
                            Add your first income above to start
                            tracking your earnings.
                        </p>

                    </div>

                ) : (

                    <div className="income-table-wrapper">

                        <table className="income-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Source</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Bank</th>
                                    <th>Action</th>
                                </tr>

                            </thead>

                            <tbody>

                                {list.map((item) => (

                                    <tr key={item.id}>

                                        <td>
                                            <span className="income-id">
                                                #{item.id}
                                            </span>
                                        </td>

                                        <td>
                                            <strong>
                                                {item.source}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className="income-category">
                                                {item.category || "General"}
                                            </span>
                                        </td>

                                        <td className="income-description">
                                            {item.description || "—"}
                                        </td>

                                        <td>
                                            <span className="income-amount">
                                                +{formatMoney(item.amount)}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    item.bank_account_id
                                                        ? "income-bank linked"
                                                        : "income-bank"
                                                }
                                            >
                                                {getBankName(
                                                    item.bank_account_id
                                                )}
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="income-delete-btn"
                                                onClick={() =>
                                                    remove(item.id)
                                                }
                                            >
                                                Delete
                                            </button>

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

export default Income;