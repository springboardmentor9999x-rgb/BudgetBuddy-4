import "../styles/ProgressCards.css";
import { FaWallet, FaPiggyBank } from "react-icons/fa";

function ProgressCards() {
  return (
    <div className="progress-container">

      <div className="progress-card">

        <div className="progress-header">
          <div className="progress-icon budget-icon">
            <FaWallet />
          </div>

          <div>
            <h3>Monthly Budget</h3>
            <p>Budget Utilization</p>
          </div>
        </div>

        <div className="progress-value">
          ₹36,000 <span>/ ₹50,000</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill budget-fill"
            style={{ width: "72%" }}
          ></div>
        </div>

        <div className="progress-footer">
          <span>72% Used</span>
          <span>₹14,000 Left</span>
        </div>

      </div>

      <div className="progress-card">

        <div className="progress-header">
          <div className="progress-icon savings-icon">
            <FaPiggyBank />
          </div>

          <div>
            <h3>Savings Goal</h3>
            <p>Current Progress</p>
          </div>
        </div>

        <div className="progress-value">
          ₹30,000 <span>/ ₹50,000</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill savings-fill"
            style={{ width: "60%" }}
          ></div>
        </div>

        <div className="progress-footer">
          <span>60% Completed</span>
          <span>₹20,000 Remaining</span>
        </div>

      </div>

    </div>
  );
}

export default ProgressCards;