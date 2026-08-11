import "../styles/RecentTransactions.css";

function RecentTransactions({ dashboard }) {

  const transactions = dashboard?.recent_transactions || [];

  return (
    <div className="recent-transactions">

      <div className="section-header">
        <h2>Recent Transactions</h2>
      </div>

      {transactions.length === 0 ? (

        <div className="empty-state">
          No recent transactions found.
        </div>

      ) : (

        <table className="transaction-table">

          <thead>

            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>

          </thead>

          <tbody>

            {transactions.map((item, index) => (

              <tr key={index}>

                <td>{item.category}</td>

                <td className="amount">
                  ₹{Number(item.amount).toLocaleString("en-IN")}
                </td>

                <td>{item.date}</td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>
  );
}

export default RecentTransactions;