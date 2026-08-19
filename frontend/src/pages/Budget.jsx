import { useEffect, useState } from "react";
import api from "../api/axios";
import ProtectedLayout from "../components/ProtectedLayout";


function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [progressData, setProgressData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    category: "",
    limit_amount: "",
  });


  // =====================================================
  // Load Budgets
  // =====================================================

  useEffect(() => {
    loadBudgets();
  }, []);


  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        budgetsResponse,
        progressResponse,
      ] = await Promise.all([
        api.get("/budgets/"),
        api.get("/budgets/progress"),
      ]);

      setBudgets(
        budgetsResponse.data || []
      );

      setProgressData(
        progressResponse.data || []
      );

    } catch (err) {
      console.error(
        "Budget loading error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load budgets."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // Form Change
  // =====================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  // =====================================================
  // Create Budget
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      await api.post("/budgets/", {
        category: form.category.trim(),
        limit_amount: Number(
          form.limit_amount
        ),
      });

      setForm({
        category: "",
        limit_amount: "",
      });

      setShowForm(false);

      await loadBudgets();

    } catch (err) {
      console.error(
        "Create budget error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to create budget."
      );
    }
  };


  // =====================================================
  // Delete Budget
  // =====================================================

  const deleteBudget = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this budget?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/budgets/${id}`
      );

      await loadBudgets();

    } catch (err) {
      console.error(
        "Delete budget error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to delete budget."
      );
    }
  };


  // =====================================================
  // Get Progress for Category
  // =====================================================

  const getProgressForBudget = (
    budget
  ) => {
    return (
      progressData.find(
        (item) =>
          item.category ===
          budget.category
      ) || {
        category: budget.category,
        limit: budget.limit_amount,
        spent: 0,
        remaining: budget.limit_amount,
        percentage: 0,
      }
    );
  };


  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <ProtectedLayout>

        <div className="bg-white rounded-2xl shadow-md p-10 text-center">

          <p className="text-gray-500 text-lg">
            Loading budgets...
          </p>

        </div>

      </ProtectedLayout>
    );
  }


  return (
    <ProtectedLayout>

      <div className="space-y-8">


        {/* =================================================
            Header
        ================================================= */}

        <div className="flex flex-col md:flex-row
                        md:items-center
                        md:justify-between
                        gap-4">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Budgets
            </h1>

            <p className="text-gray-500 mt-2">
              Set spending limits and monitor your
              expenses.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              setShowForm(!showForm)
            }
            className="bg-blue-600
                       hover:bg-blue-700
                       text-white px-5 py-3
                       rounded-lg
                       font-semibold
                       transition"
          >
            {showForm
              ? "Close"
              : "+ Create Budget"}
          </button>

        </div>


        {/* =================================================
            Error
        ================================================= */}

        {error && (

          <div className="bg-red-100
                          border border-red-200
                          text-red-700
                          px-5 py-4
                          rounded-xl">

            {error}

          </div>

        )}


        {/* =================================================
            Create Budget Form
        ================================================= */}

        {showForm && (

          <div className="bg-white
                          rounded-2xl
                          shadow-md
                          p-6">

            <h2 className="text-xl font-bold
                           text-gray-900 mb-6">

              Create New Budget

            </h2>


            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1
                         md:grid-cols-2
                         gap-5"
            >


              {/* Category */}

              <div>

                <label
                  className="block text-sm
                             font-medium
                             text-gray-700
                             mb-2"
                >
                  Category
                </label>


                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Food, Travel, Shopping..."
                  required
                  className="w-full
                             border
                             border-gray-300
                             rounded-lg
                             px-4 py-3
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                />

              </div>


              {/* Limit Amount */}

              <div>

                <label
                  className="block text-sm
                             font-medium
                             text-gray-700
                             mb-2"
                >
                  Budget Limit
                </label>


                <input
                  type="number"
                  name="limit_amount"
                  value={form.limit_amount}
                  onChange={handleChange}
                  placeholder="Enter budget limit"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full
                             border
                             border-gray-300
                             rounded-lg
                             px-4 py-3
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                />

              </div>


              {/* Submit */}

              <div className="md:col-span-2">

                <button
                  type="submit"
                  className="bg-blue-600
                             hover:bg-blue-700
                             text-white
                             px-6 py-3
                             rounded-lg
                             font-semibold
                             transition"
                >
                  Create Budget
                </button>

              </div>

            </form>

          </div>

        )}


        {/* =================================================
            Budget List
        ================================================= */}

        {budgets.length === 0 ? (

          <div className="bg-white
                          rounded-2xl
                          shadow-md
                          p-10
                          text-center">

            <div className="text-5xl mb-4">
              🎯
            </div>

            <h2 className="text-xl font-bold
                           text-gray-800">
              No Budgets Yet
            </h2>

            <p className="text-gray-500 mt-2">
              Create your first budget to start
              tracking your spending.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1
                          md:grid-cols-2
                          xl:grid-cols-3
                          gap-6">

            {budgets.map((budget) => {

              const progress =
                getProgressForBudget(
                  budget
                );


              const limit =
                Number(
                  budget.limit_amount || 0
                );


              const spent =
                Number(
                  progress.spent || 0
                );


              const remaining =
                Number(
                  progress.remaining ??
                  Math.max(
                    limit - spent,
                    0
                  )
                );


              const percentage =
                Number(
                  progress.percentage || 0
                );


              return (

                <div
                  key={budget.id}
                  className="bg-white
                             rounded-2xl
                             shadow-md
                             p-6"
                >


                  {/* =================================================
                      Header
                  ================================================= */}

                  <div className="flex items-start
                                  justify-between
                                  mb-6">

                    <div>

                      <h2 className="text-xl
                                     font-bold
                                     text-gray-900">
                        {budget.category}
                      </h2>

                      <p className="text-sm
                                    text-gray-500
                                    mt-1">
                        Budget #{budget.id}
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        deleteBudget(
                          budget.id
                        )
                      }
                      className="text-red-500
                                 hover:text-red-700
                                 text-sm
                                 font-medium"
                    >
                      Delete
                    </button>

                  </div>


                  {/* =================================================
                      Budget Limit
                  ================================================= */}

                  <div className="flex
                                  justify-between
                                  items-center
                                  mb-3">

                    <span className="text-gray-500">
                      Budget Limit
                    </span>

                    <span className="font-bold
                                     text-gray-900">

                      ₹
                      {limit.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        }
                      )}

                    </span>

                  </div>


                  {/* =================================================
                      Spent
                  ================================================= */}

                  <div className="flex
                                  justify-between
                                  items-center
                                  mb-3">

                    <span className="text-gray-500">
                      Spent
                    </span>

                    <span className="font-semibold
                                     text-red-600">

                      ₹
                      {spent.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        }
                      )}

                    </span>

                  </div>


                  {/* =================================================
                      Remaining
                  ================================================= */}

                  <div className="flex
                                  justify-between
                                  items-center
                                  mb-5">

                    <span className="text-gray-500">
                      Remaining
                    </span>

                    <span className="font-semibold
                                     text-green-600">

                      ₹
                      {remaining.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        }
                      )}

                    </span>

                  </div>


                  {/* =================================================
                      Progress Bar
                  ================================================= */}

                  <div className="w-full
                                  bg-gray-200
                                  rounded-full
                                  h-3">

                    <div
                      className={`h-3
                                  rounded-full ${
                        percentage >= 100
                          ? "bg-red-500"
                          : percentage >= 80
                          ? "bg-yellow-500"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          percentage,
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  {/* =================================================
                      Progress Information
                  ================================================= */}

                  <div className="flex
                                  justify-between
                                  mt-3
                                  text-sm">

                    <span className="text-gray-500">

                      {percentage.toFixed(1)}%
                      used

                    </span>


                    {percentage >= 100 ? (

                      <span className="text-red-600
                                       font-semibold">
                        Budget exceeded
                      </span>

                    ) : percentage >= 80 ? (

                      <span className="text-yellow-600
                                       font-semibold">
                        Near limit
                      </span>

                    ) : (

                      <span className="text-green-600
                                       font-semibold">
                        On track
                      </span>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </ProtectedLayout>
  );
}


export default Budget;