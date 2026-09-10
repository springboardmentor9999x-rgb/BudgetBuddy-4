import { useAppSettings } from "../utils/useAppSettings";
import { formatMoney } from "../utils/settings";

function RecentTransactions({

    income,

    expense

}) {

    const settings = useAppSettings();
    const currency = settings?.currency || "INR";

    const transactions = [

        ...income.map(item => ({

            type: "Income",

            title: item.source,

            amount: item.amount,

            date: item.transaction_date || item.created_at

        })),

        ...expense.map(item => ({

            type: "Expense",

            title: item.category,

            amount: item.amount,

            date: item.transaction_date || item.created_at

        }))

    ]

    .sort(

        (a,b)=>

        new Date(b.date)-new Date(a.date)

    )

    .slice(0,10);

    return(

        <div className="card shadow p-4">

            <h4>

                Recent Transactions

            </h4>

            <table className="table mt-3">

                <thead>

                    <tr>

                        <th>Type</th>

                        <th>Title</th>

                        <th>Amount</th>

                        <th>Date</th>

                    </tr>

                </thead>

                <tbody>

                {

                    transactions.length===0?

                    (

                        <tr>

                            <td
                                colSpan="4"
                                className="text-center"
                            >

                                No Transactions

                            </td>

                        </tr>

                    )

                    :

                    transactions.map((item,index)=>(

                        <tr key={index}>

                            <td>

                                {item.type}

                            </td>

                            <td>

                                {item.title}

                            </td>

                            <td>

                                {formatMoney(item.amount, currency)}

                            </td>

                            <td>

                                {item.date ? new Date(item.date).toLocaleDateString() : "-"}

                            </td>

                        </tr>

                    ))

                }

                </tbody>

            </table>

        </div>

    );

}

export default RecentTransactions;