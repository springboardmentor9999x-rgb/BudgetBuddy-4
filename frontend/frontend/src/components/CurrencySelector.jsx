import { useAppSettings } from "../utils/useAppSettings";
import { saveAppSettings, getCurrencyMeta } from "../utils/settings";

function CurrencySelector() {
    const settings = useAppSettings();
    const currency = settings.currency || "INR";

    const handleChange = (event) => {
        saveAppSettings({
            ...settings,
            currency: event.target.value,
        });
    };

    return (
        <div className="card shadow-sm p-3 mb-3">
            <h5>Select Currency</h5>
            <select
                className="form-select"
                value={currency}
                onChange={handleChange}
            >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
            </select>
            <small className="text-muted mt-2 d-block">
                All BudgetBuddy financial records are stored in INR and converted only for display.
                Current display: {getCurrencyMeta(currency).name}.
            </small>
        </div>
    );
}

export default CurrencySelector;
