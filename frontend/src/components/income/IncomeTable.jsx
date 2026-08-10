import {
  FaTrash,
  FaUniversity,
  FaEdit,
} from "react-icons/fa";

function IncomeTable({ incomes, onDelete, onEdit }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">

      {/* Responsive Table */}
      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px]">

          {/* Table Header */}
          <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <tr>

              <th className="text-left px-6 py-4">
                Source
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

          {/* Table Body */}
          <tbody>

            {incomes.map((income) => (

              <tr
                key={income.id}
                className="border-b hover:bg-blue-50 transition duration-200"
              >

                {/* Source */}
                <td className="px-6 py-4 font-medium text-gray-800">
                  {income.source}
                </td>

                {/* Bank */}
                <td className="px-6 py-4">

                  <div className="flex items-center gap-2">

                    <FaUniversity className="text-blue-600" />

                    <span>
                      {income.bank_name || "-"}
                    </span>

                  </div>

                </td>

                {/* Amount */}
                <td className="px-6 py-4 font-bold text-green-600">
                  ₹{Number(income.amount).toLocaleString("en-IN")}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-gray-600">
                  {income.description || "-"}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-gray-700">
                  {new Date(income.date).toLocaleDateString("en-IN")}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">

                  <div className="flex items-center justify-center gap-2">

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(income)}
                      className="inline-flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg transition duration-200 font-medium"
                      title="Edit Income"
                    >
                      <FaEdit />

                      <span>
                        Edit
                      </span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDelete(income.id)}
                      className="inline-flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition duration-200 font-medium"
                      title="Delete Income"
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

export default IncomeTable;