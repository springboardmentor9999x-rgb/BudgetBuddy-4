import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar({ user }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold text-blue-600">
        BudgetBuddy
      </h1>

      <div className="flex items-center gap-6">
        <button className="text-gray-600 hover:text-blue-600">
          <FaBell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle
            size={32}
            className="text-gray-500"
          />

          <div>
            <p className="font-semibold text-gray-800">
              {user?.full_name}
            </p>

            <p className="text-xs text-gray-500">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;