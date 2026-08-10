import {
  FaTrash,
  FaUniversity,
  FaCreditCard,
  FaEdit,
} from "react-icons/fa";

function ExpenseTable({ expenses, onDelete, onEdit }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px]">

          {/* Header */}
          <thead className="bg-gradient-to-r from-red-600 to-red-500 text-white">
            <tr>
              <th className="text-left px-6 py-4">
                Category
              </th>

              <th className="text-left px-6 py-4">
                Payment
              </th>

              <th className="text-left px-6 py-4">
                Bank
              </th>

              <th className="text-left px-6 py-4">
                Amount
              </th>

              <th className="text-left px-6 py-4">
                Description
              </th>

              <th className="text-left px-6 py-4">
                Date
              </th>

              <th className="text-center px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="border-b hover:bg-red-50 transition duration-200"
              >

                {/* Category */}
                <td className="px-6 py-4 font-medium text-gray-800">
                  {expense.category}
                </td>

                {/* Payment */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FaCreditCard className="text-red-500" />

                    <span>
                      {expense.payment_method || "-"}
                    </span>
                  </div>
                </td>

                {/* Bank */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FaUniversity className="text-blue-600" />

                    <span>
                      {expense.bank_name || "-"}
                    </span>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4 font-bold text-red-600">
                  ₹{Number(expense.amount).toLocaleString("en-IN")}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-gray-600">
                  {expense.description || "-"}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-gray-700">
                  {new Date(expense.date).toLocaleDateString("en-IN")}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">

                  <div className="flex items-center justify-center gap-2">

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      className="inline-flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg transition duration-200 font-medium"
                      title="Edit Expense"
                    >
                      <FaEdit />

                      <span>
                        Edit
                      </span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDelete(expense.id)}
                      className="inline-flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition duration-200 font-medium"
                      title="Delete Expense"
                    >
                      <FaTrash />

                      <span>
                        Delete
                      </span>
                    </button>

                  </div>

                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ExpenseTable;