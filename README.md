# BudgetBuddy

BudgetBuddy is a personal-finance web app built with React, FastAPI, PostgreSQL, SQLAlchemy, and Alembic.

## Included functionality

- Verified email signup, JWT login, session validation, and protected pages.
- User-scoped income, expense, and monthly budget CRUD APIs.
- Dashboard totals, category summaries, and recent transactions.
- Savings goals with contributions, 50% and completion milestones.
- Budget-exceeded alerts, notification inbox, and manual monthly report notification.
- Analytics endpoints for category spending, rolling monthly trends, savings progress, and summary metrics.
- Monthly JSON reports plus streamed PDF and Excel exports.
- Isolated backend tests and frontend Jest/React Testing Library smoke tests.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and supply PostgreSQL and SMTP values.
2. In `backend`, create/activate a virtual environment and run `pip install -r requirements.txt`.
3. Apply the schema: `alembic upgrade head`.
4. Start the API: `uvicorn app.main:app --reload`.
5. Copy `frontend/.env.example` to `frontend/.env`, then run `npm install` and `npm run dev` in `frontend`.
6. Open `http://localhost:5173`.

`VITE_API_URL` controls the frontend API URL. It falls back to `http://127.0.0.1:8000` for local development.

## API endpoints

All endpoints below, except authentication routes, require a bearer token.

- `POST /auth/signup`, `POST /auth/verify-email`, `POST /auth/login`, `GET /auth/me`
- `GET|POST|PUT|DELETE /expenses`
- `GET|POST|PUT|DELETE /income`
- `GET|POST|PUT|DELETE /budgets` and `GET /budgets/summary`
- `GET|POST|PUT|DELETE /goals` and `PATCH /goals/{id}/contribute`
- `GET /notifications`, `PATCH /notifications/{id}/read`
- `GET /analytics/spending-by-category`
- `GET /analytics/monthly-trend?months=6` (rolling 1–12 months)
- `GET /analytics/savings-progress`
- `GET /analytics/summary`
- `GET /reports/monthly?month=8&year=2026`
- `GET /reports/export/pdf?month=8&year=2026`
- `GET /reports/export/excel?month=8&year=2026`

## Architecture

The React/Vite frontend calls the FastAPI application through the shared Axios client. FastAPI routers enforce JWT authentication and pass the current user ID into CRUD, analytics, and report queries. SQLAlchemy models are migrated with Alembic against PostgreSQL in deployment; tests override the database dependency with an isolated SQLite database. Recharts renders the analytics screen, while PDF and Excel reports are generated in memory and streamed as downloads.

## Tests

From `backend`, run:

```powershell
..\venv\Scripts\python.exe -m pytest tests -q
```

From `frontend`, run:

```powershell
npm test
```

## Deployment checklist

Set `DATABASE_URL`, `SECRET_KEY`, SMTP settings, and `FRONTEND_URL` in the backend host. Set `VITE_API_URL` in the frontend host to the deployed HTTPS API URL, and update the backend CORS allow-list in `backend/app/main.py` to the deployed frontend origin. Confirm HTTPS, signup, expense creation, analytics, and both export downloads on the live URLs.
