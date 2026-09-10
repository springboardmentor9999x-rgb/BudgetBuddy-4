
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "../utils/notifications";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatMoney, getCurrencyMeta, getAppSettings, convertToINR } from "../utils/settings";
import LoadingSpinner from "../components/LoadingSpinner";

import {
    getSavingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    contributeSavingsGoal,
    deleteSavingsGoal,
} from "../services/savingsGoalService";

import "../styles/savingsGoal.css";

function SavingsGoal() {
    const currency = getAppSettings().currency || "INR";
    const currencyMeta = getCurrencyMeta(currency);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [goalName, setGoalName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [savedAmount, setSavedAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadGoals = async () => {
        try {
            setLoading(true);

            const data = await getSavingsGoals();

            setGoals(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Savings goals error:", error);
            toast.error("Unable to load savings goals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGoals();
    }, []);

    const submit = async (e) => {
        e.preventDefault();

        const cleanName = goalName.trim();
        const target = Number(targetAmount);
        const saved = Number(savedAmount || 0);

        if (!cleanName) {
            toast.error("Please enter a goal name");
            return;
        }

        if (!target || target <= 0) {
            toast.error("Please enter a valid target amount");
            return;
        }

        if (saved < 0) {
            toast.error("Saved amount cannot be negative");
            return;
        }

        if (saved > target) {
            toast.error("Saved amount cannot be greater than target amount");
            return;
        }

        setSubmitting(true);

        try {
            await addSavingsGoal({
                goal_name: cleanName,
                // Savings amounts are entered in the selected display currency;
                // the API/database continue to store INR.
                target_amount: convertToINR(target, currency),
                saved_amount: convertToINR(saved, currency),
            });

            toast.success("Savings goal added successfully");

            setGoalName("");
            setTargetAmount("");
            setSavedAmount("");

            await loadGoals();
        } catch (error) {
            console.error("Add savings goal error:", error);

            toast.error(
                error.response?.data?.detail ||
                "Unable to add savings goal"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const addProgress = async (goal, amount) => {
        try {
            const currentSaved = Number(goal.saved_amount || 0);
            const target = Number(goal.target_amount || 0);

            const newSaved = Math.min(
                target,
                currentSaved + amount
            );

            const contribution = Math.max(0, newSaved - currentSaved);
            if (contribution <= 0) {
                toast.info("This savings goal is already complete.");
                return;
            }

            await contributeSavingsGoal(goal.id, contribution);

            toast.success(`${formatMoney(contribution, currency)} added to ${goal.goal_name}`);

            await loadGoals();
        } catch (error) {
            console.error("Update savings goal error:", error);
            toast.error("Unable to update savings progress");
        }
    };

    const remove = async (id) => {
        try {
            await deleteSavingsGoal(id);

            toast.success("Savings goal deleted");

            await loadGoals();
        } catch (error) {
            console.error("Delete savings goal error:", error);
            toast.error("Unable to delete savings goal");
        }
    };

    return (
        <div className="bb-savings-root">

            <Sidebar />

            <Navbar />

            <ToastContainer
                position="top-right"
                autoClose={2500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
            />

            <main className="bb-savings-page">

                {/* =========================================
                    HEADER
                ========================================= */}

                <section className="bb-savings-header">

                    <div className="bb-savings-header-content">

                        <span className="bb-savings-eyebrow">
                            FINANCIAL PLANNING
                        </span>

                        <h1>
                            Savings Goals
                        </h1>

                        <p>
                            Turn your plans into progress and track
                            every milestone.
                        </p>

                    </div>

                    <div className="bb-savings-header-icon">
                        <span className="bb-savings-verified">✓</span>
                        🎯
                    </div>

                </section>


                {/* =========================================
                    CREATE GOAL
                ========================================= */}

                <section className="bb-goal-create-card">

                    <div className="bb-create-heading">

                        <div className="bb-create-icon">
                            +
                        </div>

                        <div>
                            <h3>
                                Create a Savings Goal
                            </h3>

                            <p>
                                Set a target and start building towards it.
                            </p>
                        </div>

                    </div>


                    <form
                        className="bb-goal-form"
                        onSubmit={submit}
                    >

                        <div className="bb-field">

                            <label htmlFor="goal-name">
                                Goal Name
                            </label>

                            <input
                                id="goal-name"
                                type="text"
                                placeholder="e.g. New Laptop Fund"
                                value={goalName}
                                onChange={(e) =>
                                    setGoalName(e.target.value)
                                }
                                disabled={submitting}
                            />

                        </div>


                        <div className="bb-field">

                            <label htmlFor="target-amount">
                                Target Amount
                            </label>

                            <div className="bb-input-money">

                                <span>{currencyMeta.symbol}</span>

                                <input
                                    id="target-amount"
                                    type="number"
                                    placeholder="50000"
                                    min="1"
                                    value={targetAmount}
                                    onChange={(e) =>
                                        setTargetAmount(e.target.value)
                                    }
                                    disabled={submitting}
                                />

                            </div>

                        </div>


                        <div className="bb-field">

                            <label htmlFor="saved-amount">
                                Already Saved
                            </label>

                            <div className="bb-input-money">

                                <span>{currencyMeta.symbol}</span>

                                <input
                                    id="saved-amount"
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={savedAmount}
                                    onChange={(e) =>
                                        setSavedAmount(e.target.value)
                                    }
                                    disabled={submitting}
                                />

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="bb-create-goal-btn"
                            disabled={submitting}
                        >

                            {submitting ? (
                                <>
                                    <span className="bb-button-spinner" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Create Goal
                                    <span>→</span>
                                </>
                            )}

                        </button>

                    </form>

                </section>


                {/* =========================================
                    LOADING
                ========================================= */}

                {loading && (
                    <div className="bb-savings-loading">
                        <LoadingSpinner />
                    </div>
                )}


                {/* =========================================
                    EMPTY STATE
                ========================================= */}

                {!loading && goals.length === 0 && (

                    <section className="bb-empty-goals">

                        <div className="bb-empty-icon">
                            🎯
                        </div>

                        <h3>
                            No savings goals yet
                        </h3>

                        <p>
                            Create your first savings goal above
                            and start tracking your progress.
                        </p>

                    </section>

                )}


                {/* =========================================
                    GOALS
                ========================================= */}

                {!loading && goals.length > 0 && (

                    <section className="bb-goals-section">

                        <div className="bb-section-heading">

                            <div>

                                <span>
                                    YOUR GOALS
                                </span>

                                <h2>
                                    Savings Progress
                                </h2>

                            </div>

                            <div className="bb-goal-count">
                                {goals.length}{" "}
                                {goals.length === 1 ? "Goal" : "Goals"}
                            </div>

                        </div>


                        <div className="bb-goals-grid">

                            {goals.map((goal) => {

                                const target =
                                    Number(goal.target_amount || 0);

                                const saved =
                                    Number(goal.saved_amount || 0);

                                const percent =
                                    target > 0
                                        ? Math.min(
                                            100,
                                            Math.round(
                                                (saved / target) * 100
                                            )
                                        )
                                        : 0;
                                const completed = percent >= 100;

                                const complete =
                                    saved >= target;

                                const remaining =
                                    Math.max(
                                        0,
                                        target - saved
                                    );

                                return (

                                    <article
                                        className={`bb-goal-card ${
                                            complete ? "completed" : ""
                                        }`}
                                        key={goal.id}
                                    >

                                        <div className="bb-goal-top">

                                            <div className="bb-goal-title-wrap">

                                                <div className="bb-goal-icon">
                                                    {complete ? "✓" : "🎯"}
                                                </div>

                                                <div>

                                                    <h3>
                                                        {goal.goal_name}
                                                    </h3>

                                                    <span>
                                                        Goal #{goal.id}
                                                    </span>

                                                </div>

                                            </div>


                                            {complete && (
                                                <span className="bb-completed-badge">
                                                    ✓ Completed
                                                </span>
                                            )}

                                        </div>


                                        <div className="bb-goal-amounts">

                                            <div>

                                                <span className="bb-amount-label">
                                                    SAVED
                                                </span>

                                                <strong className="bb-saved-amount">
                                                    {formatMoney(saved)}
                                                </strong>

                                            </div>

                                            <div className="bb-target-amount">

                                                <span className="bb-amount-label">
                                                    TARGET
                                                </span>

                                                <strong>
                                                    {formatMoney(target)}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="bb-progress-area">

                                            <div className="bb-progress-header">

                                                <span>
                                                    Progress
                                                </span>

                                                <strong>
                                                    {percent}%
                                                </strong>

                                            </div>

                                            <div className="bb-progress-track">

                                                <div
                                                    className="bb-progress-fill"
                                                    style={{
                                                        width: `${percent}%`
                                                    }}
                                                />

                                            </div>

                                        </div>


                                        {!complete && (

                                            <div className="bb-remaining">

                                                <span>
                                                    {formatMoney(remaining)} remaining
                                                </span>

                                                <span>
                                                    Keep going!
                                                </span>

                                            </div>

                                        )}


                                        {complete && (

                                            <div className="bb-complete-message">
                                                🎉 Congratulations! Goal achieved.
                                            </div>

                                        )}


                                        <div className="bb-goal-actions">

                                            <button
                                                type="button"
                                                className="bb-add-progress-btn"
                                                disabled={complete}
                                                onClick={() =>
                                                    addProgress(
                                                        goal,
                                                        convertToINR(500, currency)
                                                    )
                                                }
                                            >
                                                + {currencyMeta.symbol}500
                                            </button>

                                            <button
                                                type="button"
                                                className="bb-delete-goal-btn"
                                                onClick={() =>
                                                    remove(goal.id)
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </article>

                                );

                            })}

                        </div>

                    </section>

                )}

            </main>

            <Footer />

        </div>
    );
}

export default SavingsGoal;

