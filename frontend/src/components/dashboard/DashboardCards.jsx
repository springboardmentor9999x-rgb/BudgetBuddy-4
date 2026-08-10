import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaPiggyBank,
} from "react-icons/fa";

function DashboardCards({ dashboard }) {
  const savings =
    dashboard.total_income - dashboard.total_expense;

  const cards = [
    {
      title: "Current Balance",
      value: `₹${dashboard.balance.toLocaleString()}`,
      icon: <FaWallet />,
      color: "bg-blue-500",
    },
    {
      title: "Total Income",
      value: `₹${dashboard.total_income.toLocaleString()}`,
      icon: <FaArrowUp />,
      color: "bg-green-500",
    },
    {
      title: "Total Expenses",
      value: `₹${dashboard.total_expense.toLocaleString()}`,
      icon: <FaArrowDown />,
      color: "bg-red-500",
    },
    {
      title: "Savings",
      value: `₹${savings.toLocaleString()}`,
      icon: <FaPiggyBank />,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center hover:shadow-xl transition"
        >
          <div>
            <p className="text-gray-500">
              {card.title}
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {card.value}
            </h2>
          </div>

          <div
            className={`${card.color} text-white p-4 rounded-full text-2xl`}
          >
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;