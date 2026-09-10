import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../utils/notifications";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatMoney, getCurrencyMeta, getAppSettings, convertToINR } from "../utils/settings";
import LoadingSpinner from "../components/LoadingSpinner";

import {
    getBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
} from "../services/bankAccountService";

import "../styles/bankAccounts.css";

const EMPTY_FORM = {
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    account_type: "Savings",
    opening_balance: "",
};

function BankAccounts() {
    const currency = getAppSettings().currency || "INR";
    const currencyMeta = getCurrencyMeta(currency);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const loadAccounts = async () => {
        try {
            const data = await getBankAccounts();
            setAccounts(data);
        } catch {
            toast.error("Unable to load bank accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (account) => {
        setForm({
            bank_name: account.bank_name || "",
            account_holder_name: account.account_holder_name || "",
            account_number: "",
            ifsc_code: account.ifsc_code || "",
            account_type: account.account_type || "Savings",
            opening_balance: "",
        });

        setEditingId(account.id);
        setShowForm(true);
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!form.bank_name || !form.account_holder_name) {
            toast.error(
                "Bank name and account holder name are required"
            );
            return;
        }

        if (!editingId && !form.account_number) {
            toast.error("Account number is required");
            return;
        }

        setSubmitting(true);

        try {
            if (editingId) {
                await updateBankAccount(editingId, {
                    bank_name: form.bank_name,
                    account_holder_name:
                        form.account_holder_name,
                    ifsc_code: form.ifsc_code || null,
                    account_type: form.account_type,
                });

                toast.success("Bank account updated");
            } else {
                await addBankAccount({
                    bank_name: form.bank_name,
                    account_holder_name:
                        form.account_holder_name,
                    account_number: form.account_number,
                    ifsc_code: form.ifsc_code || null,
                    account_type: form.account_type,
                    opening_balance: convertToINR(
                        form.opening_balance || 0,
                        currency
                    ),
                });

                toast.success("Bank account added");
            }

            resetForm();
            await loadAccounts();
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to save bank account"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (account) => {
        const confirmed = window.confirm(
            `Delete ${account.bank_name}? Linked transactions will be kept but unlinked.`
        );

        if (!confirmed) return;

        try {
            await deleteBankAccount(account.id);

            toast.success("Bank account deleted");

            await loadAccounts();
        } catch {
            toast.error("Unable to delete bank account");
        }
    };

    const totalBalance = accounts.reduce(
        (sum, account) =>
            sum + Number(account.balance || 0),
        0
    );

    return (
        <>
            <Sidebar />

            <Navbar />

            <ToastContainer
                position="top-right"
                autoClose={2500}
            />

            <main className="bb-bank-page">

                {/* =========================
                    HEADER
                ========================= */}

                <section className="bb-bank-header">

                    <div className="bb-bank-header-content">

                        <span className="bb-bank-eyebrow">
                            FINANCIAL MANAGEMENT
                        </span>

                        <h1>
                            Bank Accounts
                        </h1>

                        <p>
                            Manage your accounts and keep track
                            of your available balance.
                        </p>

                    </div>

                    <div className="bb-bank-header-icon">
                        🏦
                    </div>

                </section>


                {/* =========================
                    SUMMARY
                ========================= */}

                <section className="bb-bank-summary">

                    <div className="bb-summary-icon">
                        {getCurrencyMeta(getAppSettings().currency).symbol}
                    </div>

                    <div className="bb-summary-content">

                        <span>
                            TOTAL BALANCE
                        </span>

                        <strong>
                            {formatMoney(totalBalance)}
                        </strong>

                        <small>
                            Across {accounts.length}{" "}
                            {accounts.length === 1
                                ? "account"
                                : "accounts"}
                        </small>

                    </div>

                    <div className="bb-summary-decoration">
                        💰
                    </div>

                </section>


                {/* =========================
                    ACTION BAR
                ========================= */}

                <div className="bb-bank-action-bar">

                    <div>
                        <span className="bb-section-label">
                            YOUR ACCOUNTS
                        </span>

                        <h2>
                            Linked Bank Accounts
                        </h2>
                    </div>

                    <button
                        className="bb-add-bank-btn"
                        onClick={() => {
                            if (showForm) {
                                resetForm();
                            } else {
                                setForm(EMPTY_FORM);
                                setEditingId(null);
                                setShowForm(true);
                            }
                        }}
                    >
                        <span>
                            {showForm ? "×" : "+"}
                        </span>

                        {showForm
                            ? "Cancel"
                            : "Add Bank Account"}
                    </button>

                </div>


                {/* =========================
                    FORM
                ========================= */}

                {showForm && (

                    <section className="bb-bank-form-card">

                        <div className="bb-form-heading">

                            <div className="bb-form-icon">
                                {editingId ? "✎" : "+"}
                            </div>

                            <div>
                                <h3>
                                    {editingId
                                        ? "Update Bank Account"
                                        : "Add New Bank Account"}
                                </h3>

                                <p>
                                    {editingId
                                        ? "Update your account details below."
                                        : "Enter your bank account details to link it with BudgetBuddy."}
                                </p>
                            </div>

                        </div>


                        <form
                            className="bb-bank-form"
                            onSubmit={submit}
                        >

                            <div className="bb-bank-field">

                                <label>
                                    Bank Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. State Bank of India"
                                    value={form.bank_name}
                                    onChange={(e) =>
                                        handleChange(
                                            "bank_name",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="bb-bank-field">

                                <label>
                                    Account Holder Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="Enter account holder name"
                                    value={
                                        form.account_holder_name
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "account_holder_name",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            {!editingId && (

                                <div className="bb-bank-field">

                                    <label>
                                        Account Number
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter account number"
                                        value={
                                            form.account_number
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "account_number",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            )}


                            <div className="bb-bank-field">

                                <label>
                                    IFSC / Bank Code
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. SBIN0001234"
                                    value={form.ifsc_code}
                                    onChange={(e) =>
                                        handleChange(
                                            "ifsc_code",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="bb-bank-field">

                                <label>
                                    Account Type
                                </label>

                                <select
                                    value={form.account_type}
                                    onChange={(e) =>
                                        handleChange(
                                            "account_type",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="Savings">
                                        Savings
                                    </option>

                                    <option value="Current">
                                        Current
                                    </option>

                                    <option value="Salary">
                                        Salary
                                    </option>
                                </select>

                            </div>


                            {!editingId && (

                                <div className="bb-bank-field">

                                    <label>
                                        Opening Balance ({currencyMeta.symbol} {currency})
                                    </label>

                                    <div className="bb-money-input">

                                        <span>
                                            {currencyMeta.symbol}
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={
                                                form.opening_balance
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "opening_balance",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                            )}


                            <div className="bb-form-actions">

                                <button
                                    type="button"
                                    className="bb-cancel-btn"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="bb-save-bank-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="bb-mini-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingId
                                                ? "Update Account"
                                                : "Add Account"}

                                            <span>
                                                →
                                            </span>
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </section>

                )}


                {/* =========================
                    LOADING
                ========================= */}

                {loading && (

                    <div className="bb-bank-loading">
                        <LoadingSpinner />
                    </div>

                )}


                {/* =========================
                    EMPTY
                ========================= */}

                {!loading &&
                    accounts.length === 0 && (

                        <section className="bb-bank-empty">

                            <div className="bb-empty-bank-icon">
                                🏦
                            </div>

                            <h3>
                                No bank accounts yet
                            </h3>

                            <p>
                                Add your first bank account to
                                start linking income and expenses.
                            </p>

                            <button
                                className="bb-empty-add-btn"
                                onClick={() => {
                                    setForm(EMPTY_FORM);
                                    setEditingId(null);
                                    setShowForm(true);
                                }}
                            >
                                + Add Bank Account
                            </button>

                        </section>

                    )}


                {/* =========================
                    ACCOUNT CARDS
                ========================= */}

                {!loading &&
                    accounts.length > 0 && (

                        <section className="bb-bank-grid">

                            {accounts.map((account) => (

                                <article
                                    className="bb-bank-card"
                                    key={account.id}
                                >

                                    <div className="bb-bank-card-top">

                                        <div className="bb-bank-logo">
                                            🏦
                                        </div>

                                        <span
                                            className={
                                                account.status ===
                                                "active"
                                                    ? "bb-status-active"
                                                    : "bb-status-inactive"
                                            }
                                        >
                                            <span />
                                            {account.status}
                                        </span>

                                    </div>


                                    <div className="bb-bank-name">
                                        {account.bank_name}
                                    </div>

                                    <div className="bb-bank-holder">
                                        {account.account_holder_name}
                                    </div>


                                    <div className="bb-bank-number">

                                        <span>
                                            ACCOUNT
                                        </span>

                                        <strong>
                                            {
                                                account.masked_account_number
                                            }
                                        </strong>

                                    </div>


                                    <div className="bb-bank-details">

                                        <div>
                                            <span>
                                                TYPE
                                            </span>

                                            <strong>
                                                {account.account_type}
                                            </strong>
                                        </div>

                                        {account.ifsc_code && (

                                            <div>
                                                <span>
                                                    IFSC
                                                </span>

                                                <strong>
                                                    {
                                                        account.ifsc_code
                                                    }
                                                </strong>
                                            </div>

                                        )}

                                    </div>


                                    <div className="bb-bank-balance">

                                        <span>
                                            AVAILABLE BALANCE
                                        </span>

                                        <strong>
                                            {formatMoney(account.balance)}
                                        </strong>

                                    </div>


                                    <div className="bb-bank-card-actions">

                                        <button
                                            className="bb-edit-bank-btn"
                                            onClick={() =>
                                                startEdit(account)
                                            }
                                        >
                                            ✎ Edit
                                        </button>

                                        <button
                                            className="bb-delete-bank-btn"
                                            onClick={() =>
                                                remove(account)
                                            }
                                        >
                                            🗑 Delete
                                        </button>

                                    </div>

                                </article>

                            ))}

                        </section>

                    )}

            </main>

            <Footer />
        </>
    );
}

export default BankAccounts;