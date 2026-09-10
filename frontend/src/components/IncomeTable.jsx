import { useAppSettings } from "../utils/useAppSettings";

import { formatMoney } from "../utils/settings";



function IncomeTable({



    income



}) {



    const settings = useAppSettings();

    const currency = settings?.currency || "INR";



    return (



        <table className="table table-striped">



            <thead>



                <tr>



                    <th>Source</th>



                    <th>Amount</th>



                </tr>



            </thead>



            <tbody>



                {



                    income.length===0?



                    (



                        <tr>



                            <td

                                colSpan="2"

                                className="text-center"

                            >



                                No Income Found



                            </td>



                        </tr>



                    ):



                    income.map(item=>(



                        <tr key={item.id}>



                            <td>



                                {item.source}



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



export default IncomeTable;