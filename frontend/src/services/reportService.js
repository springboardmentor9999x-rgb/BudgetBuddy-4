import { getIncome } from "./incomeService";

import { getExpense } from "./expenseService";



export const getReport = async (userId) => {



    const income = await getIncome(userId);



    const expense = await getExpense(userId);



    const totalIncome = income.reduce(

        (sum, item) => sum + item.amount,

        0

    );



    const totalExpense = expense.reduce(

        (sum, item) => sum + item.amount,

        0

    );



    return {



        income,



        expense,



        totalIncome,



        totalExpense,



        balance: totalIncome - totalExpense



    };



};