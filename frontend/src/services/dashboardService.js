import api from "./api";

import { getIncome } from "./incomeService";
import { getExpense } from "./expenseService";


const numberOrZero = (value) => {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
};


export const getDashboardData = async () => {

    const [
        summaryResult,
        incomeResult,
        expenseResult,
    ] = await Promise.allSettled([

        api.get("/dashboard/summary"),

        getIncome(),

        getExpense(),

    ]);


    const summary =
        summaryResult.status === "fulfilled"
            ? (
                summaryResult.value?.data || {}
            )
            : {};


    const income =
        incomeResult.status === "fulfilled"
            ? incomeResult.value
            : [];


    const expense =
        expenseResult.status === "fulfilled"
            ? expenseResult.value
            : [];


    return {

        income:
            Array.isArray(income)
                ? income
                : [],

        expense:
            Array.isArray(expense)
                ? expense
                : [],


        totalIncome:
            numberOrZero(
                summary.total_income ??
                summary.totalIncome
            ),


        totalExpense:
            numberOrZero(
                summary.total_expense ??
                summary.totalExpense
            ),


        totalBudget:
            numberOrZero(
                summary.total_budget ??
                summary.totalBudget
            ),


        balance:
            numberOrZero(
                summary.remaining_balance ??
                summary.balance
            ),


        remainingBudget:
            numberOrZero(
                summary.remaining_budget ??
                summary.remainingBudget
            ),


        budgetProgressPercentage:
            numberOrZero(
                summary.budget_progress_percentage ??
                summary.budgetProgressPercentage
            ),


        budgetExceeded:
            Boolean(
                summary.budget_exceeded ??
                summary.budgetExceeded
            ),


        year:
            summary.year ||
            new Date().getFullYear(),

    };
};