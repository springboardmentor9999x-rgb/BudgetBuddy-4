import sqlite3

from pathlib import Path



DATABASES = [

    Path(r"C:\Users\Vijayan\Downloads\BuddyBudget_project correction\BudgetBuddy_AUTH_FIXED\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\Buddy_one\BudgetBuddy_FIXED\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_Corrected_Latest\BudgetBuddy_Integration_Fixed\BudgetBuddy\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_Demo_Fixed\BudgetBuddy\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_Enhanced_Final_FIXED\BudgetBuddy_Enhanced_Final\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_FINAL_Demo_Ready (1)\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_Fixed\BudgetBuddy\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_Fixed (1)\BudgetBuddy\backend\budgetbuddy.db"),

    Path(r"C:\Users\Vijayan\Downloads\BudgetBuddy_MENTOR_DEMO_FINAL\backend\budgetbuddy.db"),

]



for db_path in DATABASES:



    if not db_path.exists():

        print()

        print("=" * 80)

        print("NOT FOUND:", db_path)

        print("=" * 80)

        continue



    print()

    print("=" * 80)

    print("DATABASE:", db_path)

    print("=" * 80)



    try:

        db = sqlite3.connect(str(db_path))



        tables = db.execute(

            "SELECT name FROM sqlite_master WHERE type = ? ORDER BY name",

            ("table",)

        ).fetchall()



        table_names = [row[0] for row in tables]



        print()

        print("TABLES:")

        for table in table_names:

            print("  ", table)



        print()

        print("ROW COUNTS:")



        for table in table_names:

            try:

                count = db.execute(

                    f'SELECT COUNT(*) FROM "{table}"'

                ).fetchone()[0]



                print(f"  {table:35} {count}")



            except Exception as e:

                print(f"  {table:35} ERROR: {e}")



        if "users" in table_names:



            print()

            print("USERS:")



            user_columns = [

                row[1]

                for row in db.execute(

                    'PRAGMA table_info("users")'

                ).fetchall()

            ]



            print("  Columns:", user_columns)



            try:

                users = db.execute(

                    'SELECT * FROM "users"'

                ).fetchall()



                print("  Number of users:", len(users))



                for user in users:

                    print("  ", user)



            except Exception as e:

                print("  Could not read users:", e)



        db.close()



    except Exception as e:

        print("DATABASE ERROR:", e)



print()

print("=" * 80)

print("DATABASE INSPECTION FINISHED")

print("=" * 80)