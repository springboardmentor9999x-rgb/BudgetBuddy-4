import { getAppSettings } from "./settings";

const translations = {
    English: {
        Dashboard: "Dashboard", "Bank Accounts": "Bank Accounts", Income: "Income",
        Expense: "Expense", Budget: "Budget", "Savings Goals": "Savings Goals",
        "Transaction History": "Transaction History", Reports: "Reports",
        Analytics: "Analytics", Settings: "Settings", Profile: "Profile",
        "MAIN MENU": "MAIN MENU", ADMIN: "ADMIN", "Admin Dashboard": "Admin Dashboard",
        "Manage Users": "Manage Users", "Activity Logs": "Activity Logs", Logout: "Logout",
    },
    Tamil: {
        Dashboard: "முகப்பு", "Bank Accounts": "வங்கி கணக்குகள்", Income: "வருமானம்",
        Expense: "செலவு", Budget: "பட்ஜெட்", "Savings Goals": "சேமிப்பு இலக்குகள்",
        "Transaction History": "பரிவர்த்தனை வரலாறு", Reports: "அறிக்கைகள்",
        Analytics: "பகுப்பாய்வு", Settings: "அமைப்புகள்", Profile: "சுயவிவரம்",
        "MAIN MENU": "முதன்மை மெனு", ADMIN: "நிர்வாகம்", "Admin Dashboard": "நிர்வாக முகப்பு",
        "Manage Users": "பயனர்களை நிர்வகி", "Activity Logs": "செயல் பதிவுகள்", Logout: "வெளியேறு",
    },
    Hindi: {
        Dashboard: "डैशबोर्ड", "Bank Accounts": "बैंक खाते", Income: "आय",
        Expense: "खर्च", Budget: "बजट", "Savings Goals": "बचत लक्ष्य",
        "Transaction History": "लेन-देन इतिहास", Reports: "रिपोर्ट",
        Analytics: "विश्लेषण", Settings: "सेटिंग्स", Profile: "प्रोफ़ाइल",
        "MAIN MENU": "मुख्य मेनू", ADMIN: "व्यवस्थापक", "Admin Dashboard": "व्यवस्थापक डैशबोर्ड",
        "Manage Users": "उपयोगकर्ता प्रबंधन", "Activity Logs": "गतिविधि लॉग", Logout: "लॉग आउट",
    },
};

export function t(key) {
    const language = getAppSettings().language || "English";
    return translations[language]?.[key] || translations.English[key] || key;
}
