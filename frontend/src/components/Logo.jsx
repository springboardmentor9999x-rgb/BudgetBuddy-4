import { FaWallet } from "react-icons/fa";

function Logo() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
        <FaWallet className="text-white text-3xl" />
      </div>

      <h1 className="mt-4 text-3xl font-bold text-gray-900">
        BudgetBuddy
      </h1>

      <p className="mt-2 text-gray-500 text-center">
        Smart Personal Finance Manager
      </p>
    </div>
  );
}

export default Logo;