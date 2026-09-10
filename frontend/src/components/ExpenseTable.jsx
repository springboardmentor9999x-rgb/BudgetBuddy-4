import { useAppSettings } from "../utils/useAppSettings";

import { formatMoney } from "../utils/settings";



function ExpenseTable({



    expense



}) {



    const settings = useAppSettings();

    const currency = settings?.currency || "INR";



    return (



        <table className="table table-hover">



            <thead>



                <tr>



                    <th>Category</th>



                    <th>Amount</th>



                </tr>



            </thead>



            <tbody>



                {



                    expense.length===0?



                    (



                        <tr>



                            <td

                                colSpan="2"

                                className="text-center"

                            >



                                No Expense Found



                            </td>



                        </tr>



                    ):



                    expense.map(item=>(



                        <tr key={item.id}>



                            <td>



                                {item.category}



                            </td>



                            <td>



                                {formatMoney(item.amount, currency)}



                            </td>



                        </tr>



                    ))



                }



            </tbody>



        </table>



    );



}



export default ExpenseTable;