import { FaWallet } from "react-icons/fa";

function EmptyIncome() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">

      <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
        <FaWallet className="text-4xl text-green-600" />
      </div>

      <h2 className="text-2xl font-bold mt-6">
        No Income Yet
      </h2>

      <p className="text-gray-500 mt-2">
        Start by adding your first income source.
      </p>

    </div>
  );
}

export default EmptyIncome;