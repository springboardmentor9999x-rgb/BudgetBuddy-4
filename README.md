# 💰 BudgetBuddy

### Smart Personal Finance Management Application

BudgetBuddy is a full-stack personal finance management web application designed to help users track their income and expenses, manage budgets, monitor financial goals, and understand their spending patterns through a centralized dashboard.

The application provides a clean and user-friendly interface for managing everyday finances while maintaining a structured backend for authentication, financial records, analytics, notifications, reports, and user settings.

---

## 🌐 Live Demo

### 🚀 Try BudgetBuddy Online

**Frontend Live Demo:**  
👉https://budgetbuddy-th94.onrender.com

**Backend API:**  
👉 https://budgetbuddy-backend-z6k1.onrender.com


# ✨ Project Overview

Managing personal finances manually can become difficult when income, expenses, budgets, savings goals, and financial reports are maintained separately.

BudgetBuddy brings these activities together into a single application.

Users can:

- Create and manage their account
- Track income
- Track expenses
- Edit and delete financial transactions
- Manage budgets
- Monitor savings goals
- View financial analytics
- Monitor their available balance
- View transaction history
- Manage bank account information
- Configure application settings
- Manage notifications
- Generate financial reports
- Export financial information
- Access a centralized financial dashboard

The goal of BudgetBuddy is to provide a simple but structured platform for making better day-to-day financial decisions.

---

# 🎯 Objectives

The major objectives of BudgetBuddy are:

1. Provide a centralized platform for personal finance management.
2. Allow users to record and monitor income and expenses.
3. Help users create and track category-based budgets.
4. Provide meaningful financial analytics and visualizations.
5. Help users monitor savings goals.
6. Provide financial reports for better decision-making.
7. Maintain secure user authentication.
8. Provide a responsive and user-friendly interface.
9. Synchronize financial information between different application pages.
10. Provide a scalable architecture that can be extended with additional financial features.

---

# 🚀 Key Features

## 👤 User Authentication

BudgetBuddy provides user authentication functionality for managing personal accounts.

Features include:

- User registration
- User login
- Authentication and authorization
- Protected application routes
- User-specific financial data
- Account validation
- Secure password handling
- Email-related verification functionality

---

# 📊 Financial Dashboard

The Dashboard provides a centralized overview of the user's financial condition.

It can display:

- Total income
- Total expenses
- Available balance
- Budget information
- Category-wise financial information
- Budget progress
- Financial analytics
- Spending visualizations
- Recent financial activity

The dashboard is designed to give users a quick understanding of their financial position without requiring them to manually calculate totals.

---

# 💵 Income Management

Users can manage their income records through the Income section.

Supported operations include:

- Add income
- View income history
- Edit income
- Delete income
- Record income amount
- Record income date and time
- Associate income with relevant financial information
- Display updated income totals

Changes made to income records are reflected in the application's financial calculations.

---

# 💸 Expense Management

The Expense section allows users to record and manage their spending.

Users can:

- Add expenses
- View expense history
- Edit expenses
- Delete expenses
- Record expense amount
- Record date and time
- Select spending categories
- Track payment methods
- Review previous transactions

This helps users understand where their money is being spent.

---

# 🎯 Budget Management

BudgetBuddy provides category-based budget management.

Users can:

- Create budgets
- Define budget amounts
- Allocate money to categories
- Track budget usage
- Monitor remaining budget
- View budget progress
- Compare spending against allocated budgets
- Manage multiple budget categories

Example categories include:

- Food
- Travel
- Shopping
- Education
- Entertainment
- Bills
- Healthcare
- Other

Budget progress indicators help users identify categories where spending is approaching or exceeding the allocated amount.

---

# 💰 Savings Goals

Users can create financial savings goals and monitor their progress.

Examples:

- New laptop
- Emergency fund
- Travel
- Education
- Personal purchases
- Long-term savings

Users can monitor:

- Goal amount
- Current savings
- Remaining amount
- Progress toward the goal

---

# 📈 Analytics

BudgetBuddy provides financial analytics to help users understand their spending behavior.

Analytics can include:

- Income analysis
- Expense analysis
- Category-wise spending
- Spending trends
- Budget performance
- Financial summaries
- Graphs and charts

Visual analytics make it easier to identify spending patterns and areas that require better financial control.

---

# 📑 Financial Reports

BudgetBuddy supports financial reporting functionality.

Reports can contain important transaction information such as:

- Transaction type
- Category
- Amount
- Date
- Time
- Bank/account information
- Income records
- Expense records
- Financial summaries

Reports can be used for reviewing personal financial activity and maintaining organized financial records.

---

# 🏦 Bank Account Management

The application includes functionality for managing bank/account-related financial information.

Users can maintain relevant account information and associate financial transactions with their accounts where applicable.

This provides better organization when users manage finances across different accounts.

---

# 🔔 Notifications

BudgetBuddy includes notification functionality for relevant financial events and application activities.

Notifications can be used to communicate:

- Budget-related information
- Account-related events
- Financial reminders
- Application updates
- Other relevant user activities

---

# ⚙️ Settings

The Settings section allows users to customize application preferences.

Supported settings can include:

- Currency
- Language
- User preferences
- Notification preferences
- Application configuration

Currency and other applicable settings are intended to propagate consistently throughout the application.

---

# 🎨 User Interface

BudgetBuddy is designed with a modern and responsive interface.

The application focuses on:

- Clean navigation
- Responsive layouts
- Simple financial cards
- Interactive tables
- Financial charts
- Budget progress indicators
- User-friendly forms
- Consistent styling
- Clear financial information

The interface is designed to work across different screen sizes.

---

# 🏗️ Project Architecture

BudgetBuddy follows a full-stack architecture consisting of a frontend application and a backend API.

```text
BudgetBuddy
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── styles/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── scripts/
│   ├── requirements.txt
│   └── .env.example
│
├── Testing/
│   └── BudgetBuddy_Test_Cases_FINAL_FILLED.xlsx
│
├── FIX_REPORT.md
├── README.md
└── .gitignore
