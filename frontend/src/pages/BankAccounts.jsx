import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../api/bankAccount";

import ProtectedLayout from "../components/ProtectedLayout";

import BankAccountForm from "../components/bank/BankAccountForm";
import BankAccountCard from "../components/bank/BankAccountCard";


function BankAccounts() {
  const [accounts, setAccounts] = useState([]);

  const [editingAccount, setEditingAccount] =
    useState(null);

  const [loading, setLoading] = useState(true);


  // -------------------------
  // Load Bank Accounts
  // -------------------------
  useEffect(() => {
    loadAccounts();
  }, []);


  const loadAccounts = async () => {
    try {
      setLoading(true);

      const data = await getBankAccounts();

      setAccounts(data);

    } catch (error) {
      console.error(
        "Failed to load bank accounts:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load bank accounts."
      );

    } finally {
      setLoading(false);
    }
  };


  // -------------------------
  // Create / Update
  // -------------------------
  const handleSubmit = async (formData) => {

    try {

      if (editingAccount) {

        await updateBankAccount(
          editingAccount.id,
          formData
        );

        toast.success(
          "Bank account updated successfully."
        );

        setEditingAccount(null);

      } else {

        await createBankAccount(
          formData
        );

        toast.success(
          "Bank account added successfully."
        );
      }

      await loadAccounts();

    } catch (error) {

      console.error(
        "Bank account error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Unable to save bank account."
      );
    }
  };


  // -------------------------
  // Edit
  // -------------------------
  const handleEdit = (account) => {
    setEditingAccount(account);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // -------------------------
  // Delete
  // -------------------------
  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this bank account?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await deleteBankAccount(id);

      toast.success(
        "Bank account deleted successfully."
      );

      // If editing deleted account
      if (
        editingAccount &&
        editingAccount.id === id
      ) {
        setEditingAccount(null);
      }

      await loadAccounts();

    } catch (error) {

      console.error(
        "Failed to delete bank account:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete bank account."
      );
    }
  };


  // -------------------------
  // Cancel Edit
  // -------------------------
  const handleCancelEdit = () => {
    setEditingAccount(null);
  };


  return (
    <ProtectedLayout>

      {/* Page Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Bank Accounts
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your connected bank accounts
          and track your balances.
        </p>

      </div>


      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Form */}
        <div className="xl:col-span-1">

          <BankAccountForm
            onSubmit={handleSubmit}
            editingAccount={editingAccount}
            onCancelEdit={handleCancelEdit}
          />

        </div>


        {/* Accounts */}
        <div className="xl:col-span-2">

          <div className="mb-4">

            <h2 className="text-xl font-bold text-gray-900">
              Your Bank Accounts
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {accounts.length}{" "}
              {accounts.length === 1
                ? "account"
                : "accounts"}{" "}
              connected
            </p>

          </div>


          {/* Loading */}
          {loading ? (

            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

              <p className="text-gray-500">
                Loading bank accounts...
              </p>

            </div>

          ) : accounts.length === 0 ? (

            /* Empty State */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

              <div className="text-5xl mb-4">
                🏦
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                No bank accounts yet
              </h3>

              <p className="text-gray-500 mt-2">
                Add your first bank account to
                start managing your finances.
              </p>

            </div>

          ) : (

            /* Account Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {accounts.map((account) => (

                <BankAccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

              ))}

            </div>

          )}

        </div>

      </div>

    </ProtectedLayout>
  );
}

export default BankAccounts;