import axios from "axios";



const API = "http://127.0.0.1:8000";



export const searchIncome = async (keyword) => {



    const response = await axios.get(



        `${API}/income/search/${keyword}`



    );



    return response.data;



};



export const searchExpense = async (keyword) => {



    const response = await axios.get(



        `${API}/expense/search/${keyword}`



    );



    return response.data;



};