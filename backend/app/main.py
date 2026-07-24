from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine

app = FastAPI()

@app.get("/")
def home():
    return {"message": "BudgetBuddy API is running successfully!"}

@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database connected successfully!"}
    except Exception as e:
        return {"error": str(e)}