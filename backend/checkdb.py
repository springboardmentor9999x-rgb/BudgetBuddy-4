import sqlite3



CURRENT_DB = r"C:\Users\Vijayan\Documents\BudgetBuddy_Enhanced_Final\backend\budgetbuddy.db"



SOURCE_DB = r"C:\Users\Vijayan\OneDrive\Desktop\BudgetBuddy_folder\BudgetBuddy_Email_Gmail_OTP\BudgetBuddy\backend\budgetbuddy.db"





def get_tables(db):

    return [

        row[0]

        for row in db.execute(

            "SELECT name FROM sqlite_master "

            "WHERE type='table' ORDER BY name"

        )

    ]





def get_columns(db, table):

    return [

        row[1]

        for row in db.execute(

            f'PRAGMA table_info("{table}")'

        )

    ]





current = sqlite3.connect(CURRENT_DB)

source = sqlite3.connect(SOURCE_DB)



current_tables = get_tables(current)

source_tables = get_tables(source)



print("\n" + "=" * 80)

print("DATABASE SCHEMA COMPARISON")

print("=" * 80)



for table in sorted(set(current_tables) | set(source_tables)):



    print(f"\n[{table}]")



    if table not in current_tables:

        print("  CURRENT: MISSING")

        print("  SOURCE : EXISTS")

        continue



    if table not in source_tables:

        print("  CURRENT: EXISTS")

        print("  SOURCE : MISSING")

        continue



    current_columns = get_columns(current, table)

    source_columns = get_columns(source, table)



    print("  CURRENT:")

    print("   ", current_columns)



    print("  SOURCE:")

    print("   ", source_columns)



    if current_columns == source_columns:

        print("  STATUS: MATCH")

    else:

        print("  STATUS: DIFFERENT")



        only_current = [

            x for x in current_columns

            if x not in source_columns

        ]



        only_source = [

            x for x in source_columns

            if x not in current_columns

        ]



        if only_current:

            print("  Only CURRENT:", only_current)



        if only_source:

            print("  Only SOURCE :", only_source)



current.close()

source.close()