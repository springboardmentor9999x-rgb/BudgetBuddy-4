import { FaWallet } from "react-icons/fa";

function IncomeHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
          <FaWallet className="text-2xl text-green-600" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Income Management
          </h1>

          <p className="text-gray-500 mt-1">
            Track and manage all your income sources.
          </p>
        </div>
      </div>
    </div>
  );
}

export default IncomeHeader;