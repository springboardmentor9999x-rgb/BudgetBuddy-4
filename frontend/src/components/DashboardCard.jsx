import {
  FaWallet,
  FaMoneyBillWave,
  FaUniversity,
  FaBullseye,
} from "react-icons/fa";

import {
  FaArrowTrendUp,
  FaArrowTrendDown,
} from "react-icons/fa6";

import "../styles/DashboardCard.css";

function DashboardCard({ title, amount, color }) {
  const icons = {
    green: <FaWallet />,
    red: <FaMoneyBillWave />,
    blue: <FaUniversity />,
    orange: <FaBullseye />,
  };

  const trend = {
    green: "+12%",
    red: "-3%",
    blue: "+8%",
    orange: "+15%",
  };

  const isPositive = color !== "red";

  return (
    <div className={`dashboard-card ${color}`}>

      <div className="card-top">

        <div>

          <span className="card-title">
            {title}
          </span>

          <h2>{amount}</h2>

        </div>

        <div className="card-icon">
          {icons[color]}
        </div>

      </div>

      <div className="card-bottom">

        <div className="trend">

          {isPositive ? (
            <FaArrowTrendUp />
          ) : (
            <FaArrowTrendDown />
          )}

          <span>{trend[color]}</span>

        </div>

        <small>Compared to last month</small>

      </div>

    </div>
  );
}

export default DashboardCard;