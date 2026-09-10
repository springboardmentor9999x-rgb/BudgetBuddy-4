// ============================================================
// BUDGETBUDDY APP SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {
    language: "English",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    showBalances: true,
    automaticLogout: false,
    notifications: true,
    darkMode: false,
};


// ============================================================
// CURRENCY METADATA
// ============================================================

export const CURRENCY_META = {
    INR: {
        symbol: "₹",
        locale: "en-IN",
        name: "Indian Rupee",
    },

    USD: {
        symbol: "$",
        locale: "en-US",
        name: "US Dollar",
    },

    EUR: {
        symbol: "€",
        locale: "de-DE",
        name: "Euro",
    },

    GBP: {
        symbol: "£",
        locale: "en-GB",
        name: "British Pound",
    },
};


// ============================================================
// CURRENCY CONVERSION
//
// IMPORTANT:
// All financial values stored in BudgetBuddy are treated as INR.
//
// Example:
// ₹1000 INR
// → USD conversion
// → EUR conversion
// → GBP conversion
//
// This prevents the incorrect behaviour:
// ₹1000 → $1000
// ============================================================

// INR → target currency rates.
//
// These are example/reference rates.
// Replace periodically with your preferred live exchange-rate
// provider if you want real-time rates.
export const INR_TO_CURRENCY = {
    INR: 1,

    USD: 0.0118,

    EUR: 0.0101,

    GBP: 0.0087,
};


// ============================================================
// GET APP SETTINGS
// ============================================================

export function getAppSettings() {
    try {
        const stored = localStorage.getItem("budgetbuddy_settings");

        return {
            ...DEFAULT_SETTINGS,
            ...(stored ? JSON.parse(stored) : {}),
        };

    } catch {
        return {
            ...DEFAULT_SETTINGS,
        };
    }
}


// ============================================================
// GET CURRENCY META
// ============================================================

export function getCurrencyMeta(currency) {
    return (
        CURRENCY_META[currency] ||
        CURRENCY_META.INR
    );
}


// ============================================================
// CONVERT INR → SELECTED CURRENCY
// ============================================================

export function convertCurrency(
    value,
    currency = getAppSettings().currency
) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return 0;
    }

    const rate =
        INR_TO_CURRENCY[currency] ??
        INR_TO_CURRENCY.INR;

    return amount * rate;
}

// Convert an amount entered in the selected display currency back to
// the INR value used by the database/API.
export function convertToINR(
    value,
    currency = getAppSettings().currency
) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return 0;
    }

    const rate =
        INR_TO_CURRENCY[currency] ??
        INR_TO_CURRENCY.INR;

    return rate > 0 ? amount / rate : amount;
}


// ============================================================
// FORMAT MONEY
//
// DATABASE VALUE = INR
//
// DISPLAY VALUE = converted selected currency
//
// Example:
//
// Database:
// 1000
//
// Selected INR:
// ₹1,000.00
//
// Selected USD:
// $11.80
//
// Selected EUR:
// €10.10
//
// Selected GBP:
// £8.70
// ============================================================

export function formatMoney(
    value,
    currency = getAppSettings().currency
) {
    const meta = getCurrencyMeta(currency);

    const convertedAmount =
        convertCurrency(
            value,
            currency
        );

    return new Intl.NumberFormat(
        meta.locale,
        {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(convertedAmount);
}


// ============================================================
// FORMAT RAW CONVERTED NUMBER
//
// Useful for Excel/report calculations.
// ============================================================

export function getConvertedValue(
    value,
    currency = getAppSettings().currency
) {
    return convertCurrency(
        value,
        currency
    );
}


// ============================================================
// DATE FORMAT
// ============================================================

export function formatDateTime(
    value,
    dateFormat = getAppSettings().dateFormat
) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    if (dateFormat === "YYYY-MM-DD") {
        return date.toISOString().slice(0, 10);
    }

    const dd = String(
        date.getDate()
    ).padStart(2, "0");

    const mm = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const yyyy =
        date.getFullYear();

    if (dateFormat === "MM/DD/YYYY") {
        return `${mm}/${dd}/${yyyy}`;
    }

    return `${dd}/${mm}/${yyyy}`;
}


// ============================================================
// FORMAT TIME
// ============================================================

export function formatTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}


// ============================================================
// SAVE APP SETTINGS
// ============================================================

export function saveAppSettings(settings) {
    const next = {
        ...DEFAULT_SETTINGS,
        ...settings,
    };

    localStorage.setItem(
        "budgetbuddy_settings",
        JSON.stringify(next)
    );

    window.dispatchEvent(
        new CustomEvent(
            "bb:settings-changed",
            {
                detail: next,
            }
        )
    );

    document.documentElement.lang =
        next.language === "Tamil"
            ? "ta"
            : next.language === "Hindi"
                ? "hi"
                : "en";

    return next;
}


// ============================================================
// DEFAULT SETTINGS EXPORT
// ============================================================

export {
    DEFAULT_SETTINGS,
};