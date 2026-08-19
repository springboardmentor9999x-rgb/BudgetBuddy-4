import {
  FaUniversity,
  FaEdit,
  FaTrash,
} from "react-icons/fa";


function BankAccountCard({
  account,
  onEdit,
  onDelete,
}) {

  // -------------------------
  // Mask Account Number
  // -------------------------
  const maskedAccountNumber =
    account.account_number
      ? `•••• ${account.account_number.slice(-4)}`
      : "••••";


  // -------------------------
  // Format Currency
  // -------------------------
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };


  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition duration-200">


      {/* =================================================
          Header
      ================================================= */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-4">

          {/* Bank Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
            <FaUniversity />
          </div>


          {/* Bank Details */}
          <div>

            <h3 className="text-lg font-bold text-gray-900">
              {account.bank_name}
            </h3>

            <p className="text-sm text-gray-500">
              {account.account_type}
            </p>

          </div>

        </div>


        {/* =================================================
            Actions
        ================================================= */}

        <div className="flex items-center gap-2">

          {/* Edit */}
          <button
            type="button"
            onClick={() =>
              onEdit(account)
            }
            className="p-2 rounded-lg text-blue-600
                       bg-blue-50 hover:bg-blue-100
                       transition"
            title="Edit Bank Account"
          >
            <FaEdit />
          </button>


          {/* Delete */}
          <button
            type="button"
            onClick={() =>
              onDelete(account.id)
            }
            className="p-2 rounded-lg text-red-600
                       bg-red-50 hover:bg-red-100
                       transition"
            title="Delete Bank Account"
          >
            <FaTrash />
          </button>

        </div>

      </div>


      {/* =================================================
          Account Number
      ================================================= */}

      <div className="mt-6">

        <p className="text-sm text-gray-500">
          Account Number
        </p>

        <p className="mt-1 font-semibold text-gray-800 tracking-wider">
          {maskedAccountNumber}
        </p>

      </div>


      {/* =================================================
          Opening Balance
      ================================================= */}

      <div className="mt-5 pt-5 border-t border-gray-100">

        <p className="text-sm text-gray-500">
          Opening Balance
        </p>

        <p className="mt-1 text-lg font-semibold text-gray-700">
          ₹{formatCurrency(
            account.opening_balance
          )}
        </p>

      </div>


      {/* =================================================
          Current Balance
      ================================================= */}

      <div className="mt-4 bg-blue-50 rounded-xl p-4">

        <p className="text-sm text-blue-600 font-medium">
          Current Balance
        </p>

        <p className="mt-1 text-3xl font-bold text-blue-700">
          ₹{formatCurrency(
            account.current_balance
          )}
        </p>

      </div>


    </div>
  );
}


export default BankAccountCard;