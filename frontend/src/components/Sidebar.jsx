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
  FaUserShield,
  FaCrown,
  FaCheckCircle,
} from "react-icons/fa";


function Sidebar({ onLogout }) {

  const navigate = useNavigate();
  const location = useLocation();


  // =========================================================
  // Get Logged-in User
  // =========================================================

  const user =
    JSON.parse(
      localStorage.getItem("user") || "null"
    );


  const role =
    user?.role?.toLowerCase();


  const isAdmin =
    role === "admin";


  const isPremium =
    role === "premium";


  // =========================================================
  // Common Menu
  // =========================================================

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


  // =========================================================
  // Premium Features
  // =========================================================

  if (isPremium || isAdmin) {

    menu.splice(
      6,
      0,

      {
        icon: <FaChartLine />,
        label: "Analytics",
        path: "/analytics",
      },

      {
        icon: <FaChartLine />,
        label: "Reports",
        path: "/reports",
      }

    );

  }


  // =========================================================
  // Admin Panel
  // =========================================================

  if (isAdmin) {

    menu.push({

      icon: <FaUserShield />,
      label: "Admin",
      path: "/admin",

    });

  }


  // =========================================================
  // Navigation
  // =========================================================

  const handleNavigation = (path) => {

    navigate(path);

  };


  // =========================================================
  // Sidebar
  // =========================================================

  return (

    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">


      {/* =====================================================
          Logo
      ===================================================== */}

      <div className="p-6 border-b border-gray-200">

        <h1 className="text-2xl font-bold text-blue-600">
          BudgetBuddy
        </h1>

        <p className="text-xs text-gray-500 mt-1">
          Smart Financial Management
        </p>

      </div>


      {/* =====================================================
          Navigation
      ===================================================== */}

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-2 text-left ${isActive
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


        {/* =====================================================
            Premium Subscription Section
        ===================================================== */}

        {!isPremium && !isAdmin && role === "student" && (

          <div className="mt-5 pt-5 border-t border-gray-200">

            {/* Section Title */}

            <div className="px-2 mb-3">

              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Premium
              </span>

            </div>


            {/* Premium Button */}

            <button
              type="button"
              onClick={() =>
                handleNavigation("/premium")
              }
              className={`group w-full text-left rounded-xl p-3 transition-all duration-200 ${location.pathname === "/premium"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:shadow-md hover:border-blue-300"
                }`}
            >

              <div className="flex items-center gap-3">

                {/* Crown */}

                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${location.pathname === "/premium"
                    ? "bg-white/20"
                    : "bg-white shadow-sm"
                    }`}
                >

                  <FaCrown
                    className={`text-lg transition-transform duration-200 group-hover:scale-110 ${location.pathname === "/premium"
                      ? "text-yellow-300"
                      : "text-yellow-500"
                      }`}
                  />

                </div>


                {/* Text */}

                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-2">

                    <span className="font-bold text-sm">
                      Upgrade to Premium
                    </span>

                  </div>

                  <p
                    className={`text-xs mt-1 ${location.pathname === "/premium"
                      ? "text-blue-100"
                      : "text-blue-500"
                      }`}
                  >
                    Unlock advanced features
                  </p>

                </div>


                {/* PRO Badge */}

                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full">
                  PRO
                </span>

              </div>

            </button>

          </div>

        )}


        {/* =====================================================
            Premium Active User
        ===================================================== */}

        {isPremium && (

          <div className="mt-5 pt-5 border-t border-gray-200">

            <div className="px-2 mb-3">

              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Subscription
              </span>

            </div>


            <button
              type="button"
              onClick={() =>
                handleNavigation("/premium")
              }
              className="w-full text-left rounded-xl p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 hover:shadow-md transition-all duration-200"
            >

              <div className="flex items-center gap-3">

                {/* Crown */}

                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">

                  <FaCrown className="text-yellow-500 text-lg" />

                </div>


                {/* Text */}

                <div className="flex-1 min-w-0">

                  <div className="font-bold text-sm">
                    Premium Plan
                  </div>

                  <p className="text-xs text-green-600 mt-1">
                    All features unlocked
                  </p>

                </div>


                {/* Active Badge */}

                <FaCheckCircle className="text-green-500" />

              </div>

            </button>

          </div>

        )}

      </nav>


      {/* =====================================================
          Logout
      ===================================================== */}

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