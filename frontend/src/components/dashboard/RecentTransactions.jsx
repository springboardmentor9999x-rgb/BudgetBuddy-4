import {
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

function RecentTransactions({ transactions }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-2xl font-bold mb-6">
        Recent Transactions
      </h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500">
          No recent transactions.
        </p>
      ) : (
        <div className="space-y-4">

          {transactions.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-4"
            >

              <div className="flex items-center gap-4">

                <div
                  className={`p-3 rounded-full ${
                    item.type === "Income"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {item.type === "Income" ? (
                    <FaArrowUp />
                  ) : (
                    <FaArrowDown />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-gray-500 text-sm">
                    {item.date}
                  </p>
                </div>

              </div>

              <div
                className={`font-bold text-lg ${
                  item.type === "Income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.type === "Income"
                  ? "+"
                  : "-"}
                ₹{item.amount.toLocaleString()}
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default RecentTransactions;