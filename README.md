# BudgetBuddy

BudgetBuddy is a personal-finance web app built with React, FastAPI, PostgreSQL, SQLAlchemy, and Alembic.

## Milestones 1–3 included

- Verified email signup, JWT login, session validation, and protected pages.
- User-scoped income, expense, and monthly budget CRUD APIs.
- Dashboard totals, category summaries, and recent transactions.
- Savings goals with contributions, 50% and completion milestones.
- Budget-exceeded alerts, notification inbox, and manual monthly report notification.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and supply your PostgreSQL and SMTP values.
2. In `backend`, create/activate a virtual environment and run `pip install -r requirements.txt`.
3. Apply the schema: `alembic upgrade head`.
4. Start the API: `uvicorn app.main:app --reload`.
5. In `frontend`, run `npm install` then `npm run dev`.
6. Open `http://localhost:5173`.

## API verification

Import `postman/BudgetBuddy-Milestone-1-3.postman_collection.json` into Postman. After Login, copy the returned `access_token` into the collection `token` variable.

## Tests

From `backend`, run:

```powershell
..\venv\Scripts\python.exe -m pytest tests -q
```

The test suite uses an isolated SQLite database and covers login/JWT identity, ownership protection, validation, budget alerts, and savings-goal milestones.
