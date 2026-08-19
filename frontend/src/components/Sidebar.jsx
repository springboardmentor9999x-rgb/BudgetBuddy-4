import { useLocation, useNavigate } from "react-router-dom";

import {
  FaChartPie,
  FaWallet,
  FaMoneyBillWave,
  FaBullseye,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaUniversity,
  FaBell,
} from "react-icons/fa";


function Sidebar({ onLogout }) {

  const navigate = useNavigate();
  const location = useLocation();


  const menu = [

    {
      icon: <FaChartPie />,
      label: "Dashboard",
      path: "/dashboard",
    },

    {
      icon: <FaWallet />,
      label: "Income",
      path: "/income",
    },

    {
      icon: <FaMoneyBillWave />,
      label: "Expenses",
      path: "/expenses",
    },

    {
      icon: <FaBullseye />,
      label: "Budgets",
      path: "/budgets",
    },

    {
      icon: <FaBullseye />,
      label: "Savings Goals",
      path: "/goals",
    },

    {
      icon: <FaUniversity />,
      label: "Bank Accounts",
      path: "/bank-accounts",
    },

    {
      icon: <FaChartLine />,
      label: "Analytics",
      path: "/analytics",
    },

    {
      icon: <FaChartLine />,
      label: "Reports",
      path: "/reports",
    },

    {
      icon: <FaBell />,
      label: "Notifications",
      path: "/notifications",
    },

    {
      icon: <FaCog />,
      label: "Settings",
      path: "/settings",
    },

  ];


  const handleNavigation = (path) => {
    navigate(path);
  };


  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}

      <div className="p-6 border-b border-gray-200">

        <h1 className="text-2xl font-bold text-blue-600">
          BudgetBuddy
        </h1>

        <p className="text-xs text-gray-500 mt-1">
          Smart Financial Management
        </p>

      </div>


      {/* Navigation */}

      <nav className="flex-1 p-4 overflow-y-auto">

        {menu.map((item) => {

          const isActive =
            location.pathname === item.path;


          return (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                handleNavigation(item.path)
              }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-2 text-left ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >

              <span className="text-lg">
                {item.icon}
              </span>

              <span className="font-medium">
                {item.label}
              </span>

            </button>
          );

        })}

      </nav>


      {/* Logout */}

      <div className="p-4 border-t border-gray-200">

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
        >

          <FaSignOutAlt />

          <span className="font-medium">
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}


export default Sidebar;