import { useEffect, useState } from "react";
import api from "../api/axios";
import ProtectedLayout from "../components/ProtectedLayout";

function SavingsGoals() {
  const [goals, setGoals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  });

  const [contributionAmounts, setContributionAmounts] =
    useState({});


  // =====================================================
  // Load Savings Goals
  // =====================================================

  useEffect(() => {
    loadGoals();
  }, []);


  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/goals/");

      setGoals(response.data || []);
    } catch (err) {
      console.error(
        "Savings goals loading error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load savings goals."
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
  // Create Savings Goal
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (!form.title.trim()) {
        setError(
          "Please enter a savings goal title."
        );
        return;
      }

      if (
        !form.target_amount ||
        Number(form.target_amount) <= 0
      ) {
        setError(
          "Target amount must be greater than zero."
        );
        return;
      }

      if (
        Number(form.current_amount || 0) < 0
      ) {
        setError(
          "Current amount cannot be negative."
        );
        return;
      }

      if (
        Number(form.current_amount || 0) >
        Number(form.target_amount)
      ) {
        setError(
          "Current amount cannot exceed target amount."
        );
        return;
      }

      await api.post("/goals/", {
        title: form.title.trim(),
        target_amount: Number(
          form.target_amount
        ),
        current_amount: Number(
          form.current_amount || 0
        ),
        target_date:
          form.target_date || null,
        status: "in_progress",
      });

      setForm({
        title: "",
        target_amount: "",
        current_amount: "0",
        target_date: "",
      });

      setShowForm(false);

      await loadGoals();

    } catch (err) {
      console.error(
        "Create savings goal error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to create savings goal."
      );
    }
  };


  // =====================================================
  // Contribution Input
  // =====================================================

  const handleContributionChange = (
    goalId,
    value
  ) => {
    setContributionAmounts({
      ...contributionAmounts,
      [goalId]: value,
    });
  };


  // =====================================================
  // Contribute Money
  // =====================================================

  const contribute = async (goalId) => {
    try {
      setError("");

      const amount = Number(
        contributionAmounts[goalId]
      );

      if (!amount || amount <= 0) {
        setError(
          "Contribution amount must be greater than zero."
        );
        return;
      }

      await api.patch(
        `/goals/${goalId}/contribute`,
        {
          amount: amount,
        }
      );

      setContributionAmounts({
        ...contributionAmounts,
        [goalId]: "",
      });

      await loadGoals();

    } catch (err) {
      console.error(
        "Contribution error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to add contribution."
      );
    }
  };


  // =====================================================
  // Delete Goal
  // =====================================================

  const deleteGoal = async (goalId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this savings goal?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/goals/${goalId}`
      );

      await loadGoals();

    } catch (err) {
      console.error(
        "Delete savings goal error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to delete savings goal."
      );
    }
  };


  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <ProtectedLayout>

        <div className="bg-white rounded-2xl shadow-md p-10 text-center">

          <p className="text-gray-500 text-lg">
            Loading savings goals...
          </p>

        </div>

      </ProtectedLayout>
    );
  }


  // =====================================================
  // Main Page
  // =====================================================

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
              Savings Goals
            </h1>

            <p className="text-gray-500 mt-2">
              Save money toward the things that matter
              to you.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              setShowForm(!showForm)
            }
            className="bg-blue-600
                       hover:bg-blue-700
                       text-white
                       px-5 py-3
                       rounded-lg
                       font-semibold
                       transition"
          >
            {showForm
              ? "Close"
              : "+ Create Goal"}
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
            Create Goal Form
        ================================================= */}

        {showForm && (

          <div className="bg-white
                          rounded-2xl
                          shadow-md
                          p-6">

            <h2 className="text-xl font-bold
                           text-gray-900 mb-6">

              Create Savings Goal

            </h2>


            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1
                         md:grid-cols-2
                         gap-5"
            >


              {/* Title */}

              <div className="md:col-span-2">

                <label className="block text-sm
                                  font-medium
                                  text-gray-700
                                  mb-2">

                  Goal Name

                </label>


                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="New Laptop, Car, Vacation..."
                  maxLength={150}
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


              {/* Target Amount */}

              <div>

                <label className="block text-sm
                                  font-medium
                                  text-gray-700
                                  mb-2">

                  Target Amount

                </label>


                <input
                  type="number"
                  name="target_amount"
                  value={form.target_amount}
                  onChange={handleChange}
                  placeholder="₹50,000"
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


              {/* Starting Amount */}

              <div>

                <label className="block text-sm
                                  font-medium
                                  text-gray-700
                                  mb-2">

                  Starting Amount

                </label>


                <input
                  type="number"
                  name="current_amount"
                  value={form.current_amount}
                  onChange={handleChange}
                  placeholder="₹0"
                  min="0"
                  step="0.01"
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


              {/* Target Date */}

              <div>

                <label className="block text-sm
                                  font-medium
                                  text-gray-700
                                  mb-2">

                  Target Date

                </label>


                <input
                  type="date"
                  name="target_date"
                  value={form.target_date}
                  onChange={handleChange}
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
                  Create Savings Goal
                </button>

              </div>

            </form>

          </div>

        )}


        {/* =================================================
            Goals
        ================================================= */}

        {goals.length === 0 ? (

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

              No Savings Goals Yet

            </h2>

            <p className="text-gray-500 mt-2">

              Create your first goal and start
              saving today.

            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1
                          md:grid-cols-2
                          xl:grid-cols-3
                          gap-6">

            {goals.map((goal) => {

              const target =
                Number(
                  goal.target_amount || 0
                );

              const current =
                Number(
                  goal.current_amount || 0
                );

              const percentage =
                target > 0
                  ? Math.min(
                      (current / target) * 100,
                      100
                    )
                  : 0;

              const remaining =
                Math.max(
                  target - current,
                  0
                );


              return (

                <div
                  key={goal.id}
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
                                  mb-5">

                    <div>

                      <h2 className="text-xl
                                     font-bold
                                     text-gray-900">

                        {goal.title}

                      </h2>


                      <p className="text-sm
                                    text-gray-500
                                    mt-1">

                        {goal.status === "completed"
                          ? "Completed"
                          : "In Progress"}

                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        deleteGoal(
                          goal.id
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
                      Amounts
                  ================================================= */}

                  <div className="space-y-3 mb-5">

                    <div className="flex
                                    justify-between">

                      <span className="text-gray-500">
                        Saved
                      </span>

                      <span className="font-bold
                                       text-green-600">

                        ₹
                        {current.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}

                      </span>

                    </div>


                    <div className="flex
                                    justify-between">

                      <span className="text-gray-500">
                        Target
                      </span>

                      <span className="font-semibold">

                        ₹
                        {target.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}

                      </span>

                    </div>


                    <div className="flex
                                    justify-between">

                      <span className="text-gray-500">
                        Remaining
                      </span>

                      <span className="font-semibold
                                       text-blue-600">

                        ₹
                        {remaining.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}

                      </span>

                    </div>

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
                          ? "bg-green-500"
                          : percentage >= 50
                          ? "bg-blue-600"
                          : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>


                  {/* =================================================
                      Percentage
                  ================================================= */}

                  <div className="flex
                                  justify-between
                                  mt-3
                                  text-sm">

                    <span className="text-gray-500">

                      {percentage.toFixed(1)}%
                      saved

                    </span>


                    {percentage >= 100 ? (

                      <span className="text-green-600
                                       font-semibold">

                        Goal Completed 🎉

                      </span>

                    ) : percentage >= 50 ? (

                      <span className="text-blue-600
                                       font-semibold">

                        Halfway There!

                      </span>

                    ) : (

                      <span className="text-gray-500">

                        Keep Saving

                      </span>

                    )}

                  </div>


                  {/* =================================================
                      Target Date
                  ================================================= */}

                  {goal.target_date && (

                    <p className="text-sm
                                  text-gray-500
                                  mt-4">

                      Target Date:{" "}
                      {goal.target_date}

                    </p>

                  )}


                  {/* =================================================
                      Contribution
                  ================================================= */}

                  {goal.status !== "completed" && (

                    <div className="mt-6 pt-5
                                    border-t
                                    border-gray-200">

                      <p className="text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2">

                        Add Money

                      </p>


                      <div className="flex gap-2">

                        <input
                          type="number"
                          value={
                            contributionAmounts[
                              goal.id
                            ] || ""
                          }
                          onChange={(e) =>
                            handleContributionChange(
                              goal.id,
                              e.target.value
                            )
                          }
                          placeholder="Amount"
                          min="0.01"
                          step="0.01"
                          className="flex-1
                                     border
                                     border-gray-300
                                     rounded-lg
                                     px-3 py-2
                                     focus:outline-none
                                     focus:ring-2
                                     focus:ring-blue-500"
                        />


                        <button
                          type="button"
                          onClick={() =>
                            contribute(
                              goal.id
                            )
                          }
                          className="bg-green-600
                                     hover:bg-green-700
                                     text-white
                                     px-4 py-2
                                     rounded-lg
                                     font-semibold"
                        >
                          Add
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              );
            })}

          </div>

        )}

      </div>

    </ProtectedLayout>
  );
}

export default SavingsGoals;