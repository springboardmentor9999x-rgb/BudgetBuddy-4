import sqlite3



CURRENT_DB = r"C:\Users\Vijayan\Downloads\BuddyBudget_project correction\BudgetBuddy_AUTH_FIXED\backend\budgetbuddy.db"



OLD_DB = r"C:\Users\Vijayan\Downloads\BudgetBuddy_Corrected_Latest\BudgetBuddy_Integration_Fixed\BudgetBuddy\backend\budgetbuddy.db"





def get_schema(db_path):

    db = sqlite3.connect(db_path)



    tables = [

        row[0]

        for row in db.execute(

            "SELECT name FROM sqlite_master "

            "WHERE type='table' AND name NOT LIKE 'sqlite_%' "

            "ORDER BY name"

        )

    ]



    schema = {}



    for table in tables:

        schema[table] = list(

            db.execute(f"PRAGMA table_info([{table}])")

        )



    db.close()

    return schema





current = get_schema(CURRENT_DB)

old = get_schema(OLD_DB)



all_tables = sorted(set(current) | set(old))



print("=" * 80)

print("BUDGETBUDDY DATABASE SCHEMA COMPARISON")

print("=" * 80)



for table in all_tables:

    print()

    print("=" * 80)

    print("TABLE:", table)

    print("=" * 80)



    current_cols = {

        row[1]: row[2]

        for row in current.get(table, [])

    }



    old_cols = {

        row[1]: row[2]

        for row in old.get(table, [])

    }



    print("\nCURRENT AUTH_FIXED:")

    if current_cols:

        for name, dtype in current_cols.items():

            print(f"  {name:35} {dtype}")

    else:

        print("  TABLE NOT FOUND")



    print("\nOLD CORRECTED_LATEST:")

    if old_cols:

        for name, dtype in old_cols.items():

            print(f"  {name:35} {dtype}")

    else:

        print("  TABLE NOT FOUND")



    if current_cols != old_cols:

        print("\n>>> DIFFERENCES:")



        for col in sorted(set(current_cols) | set(old_cols)):

            if col not in current_cols:

                print(f"  + OLD ONLY:     {col} ({old_cols[col]})")

            elif col not in old_cols:

                print(f"  + CURRENT ONLY: {col} ({current_cols[col]})")

            elif current_cols[col] != old_cols[col]:

                print(

                    f"  + TYPE CHANGE:  {col}: "

                    f"{old_cols[col]} -> {current_cols[col]}"

                )

    else:

        print("\n>>> SCHEMA MATCHES")



print()

print("=" * 80)

print("COMPARISON FINISHED")

print("=" * 80)