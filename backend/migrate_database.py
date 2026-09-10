import sqlite3

import shutil

from pathlib import Path

from datetime import datetime





# ============================================================

# DATABASE PATHS

# ============================================================



# YOUR CURRENT PROJECT DATABASE

CURRENT_DB = Path(

    r"C:\Users\Vijayan\Downloads\BuddyBudget_project correction\BudgetBuddy_AUTH_FIXED\backend\budgetbuddy.db"

)



# OLD / SOURCE DATABASE

# This is the database you want to migrate the existing data FROM.

SOURCE_DB = Path(

    r"C:\Users\Vijayan\OneDrive\Desktop\BudgetBuddy_folder\BudgetBuddy_Email_Gmail_OTP\BudgetBuddy\backend\budgetbuddy.db"

)



# Backup of your current database before migration

BACKUP_DB = CURRENT_DB.with_name(

    f"budgetbuddy_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

)





# ============================================================

# TABLE MIGRATION ORDER

# ============================================================



# Parent tables are migrated before child tables.

TABLES = [

    "users",

    "profiles",

    "bank_accounts",

    "income",

    "expense",

    "budget",

    "budget_monthly_allocations",

    "savings_goal",

    "notifications",

    "activity_logs",

    "email_verification_tokens",

    "password_reset_tokens",

]





# ============================================================

# HELPERS

# ============================================================



def table_exists(db, table):

    result = db.execute(

        """

        SELECT 1

        FROM sqlite_master

        WHERE type = 'table'

        AND name = ?

        """,

        (table,),

    ).fetchone()



    return result is not None





def columns(db, table):

    """

    Return column names in the exact order defined by SQLite.

    """

    return [

        row[1]

        for row in db.execute(

            f'PRAGMA table_info("{table}")'

        ).fetchall()

    ]





def column_info(db, table):

    """

    Return detailed SQLite column information.

    """



    result = {}



    for row in db.execute(

        f'PRAGMA table_info("{table}")'

    ).fetchall():



        # PRAGMA table_info:

        # cid, name, type, notnull, dflt_value, pk



        result[row[1]] = {

            "type": row[2],

            "notnull": row[3],

            "default": row[4],

            "primary_key": row[5],

        }



    return result





def quote_columns(column_list):

    return ", ".join(

        f'"{column}"'

        for column in column_list

    )





def placeholders(count):

    return ", ".join(

        "?"

        for _ in range(count)

    )





# ============================================================

# SPECIAL MIGRATION VALUES

# ============================================================



def missing_column_value(

    table,

    column,

    source_row,

    source_columns,

):

    """

    Supplies values for columns that exist in the NEW database

    but did not exist in the OLD/source database.

    """



    # --------------------------------------------------------

    # USERS

    # --------------------------------------------------------

    #

    # Enhanced database introduced:

    #

    # account_tier

    #

    # Admin account -> pro

    # Normal accounts -> normal

    # --------------------------------------------------------



    if table == "users" and column == "account_tier":



        if "role" in source_columns:



            role_index = source_columns.index("role")

            role = source_row[role_index]



            if str(role).lower() == "admin":

                return "pro"



        return "normal"





    # --------------------------------------------------------

    # SAVINGS GOAL

    # --------------------------------------------------------

    #

    # Enhanced database introduced:

    #

    # created_at

    # updated_at

    #

    # If these did not exist in the old database,

    # use migration time.

    # --------------------------------------------------------



    if table == "savings_goal":



        if column in ("created_at", "updated_at"):



            return datetime.utcnow().isoformat(" ")





    # --------------------------------------------------------

    # NO SPECIAL VALUE

    # --------------------------------------------------------



    return None





# ============================================================

# MIGRATE ONE TABLE

# ============================================================



def migrate_table(source, target, table):



    if not table_exists(source, table):



        print(

            f"{table}: SOURCE TABLE NOT FOUND - SKIPPED"

        )



        return





    if not table_exists(target, table):



        raise RuntimeError(

            f"Target database is missing required table: {table}"

        )





    source_columns = columns(

        source,

        table

    )



    target_columns = columns(

        target,

        table

    )



    target_info = column_info(

        target,

        table

    )





    # --------------------------------------------------------

    # Find columns common to both databases.

    #

    # IMPORTANT:

    # Use TARGET column order.

    # --------------------------------------------------------



    common_columns = [

        column

        for column in target_columns

        if column in source_columns

    ]





    # --------------------------------------------------------

    # Find columns that exist only in target.

    # --------------------------------------------------------



    missing_columns = [

        column

        for column in target_columns

        if column not in source_columns

    ]





    print(f"\n[{table}]")



    print("  Source columns:")

    print(f"    {source_columns}")



    print("  Target columns:")

    print(f"    {target_columns}")





    if missing_columns:



        print("  New target columns:")

        print(f"    {missing_columns}")





    # --------------------------------------------------------

    # Get source rows.

    # --------------------------------------------------------



    if common_columns:



        source_select = quote_columns(

            common_columns

        )



        rows = source.execute(

            f'''

            SELECT {source_select}

            FROM "{table}"

            '''

        ).fetchall()



    else:



        rows = source.execute(

            f'SELECT * FROM "{table}"'

        ).fetchall()





    if not rows:



        print("  Rows: 0")



        return





    # --------------------------------------------------------

    # Build target column list.

    #

    # Include:

    # 1. Common columns

    # 2. New columns requiring explicit values

    #

    # Other target columns with SQLite defaults will

    # automatically use their defaults.

    # --------------------------------------------------------



    insert_columns = list(common_columns)



    explicit_missing_columns = []





    for column in missing_columns:



        test_value = missing_column_value(

            table,

            column,

            rows[0] if rows else None,

            common_columns,

        )





        if test_value is not None:



            explicit_missing_columns.append(

                column

            )



            insert_columns.append(

                column

            )



            continue





        # If target requires this column and has no default,

        # stop rather than silently corrupting data.



        info = target_info[column]





        if (

            info["notnull"]

            and info["default"] is None

            and info["primary_key"] == 0

        ):



            raise RuntimeError(

                f"Cannot migrate {table}.{column}: "

                f"target column is NOT NULL and has no default."

            )





    # --------------------------------------------------------

    # Build INSERT statement.

    # --------------------------------------------------------



    column_sql = quote_columns(

        insert_columns

    )



    value_sql = placeholders(

        len(insert_columns)

    )





    insert_sql = f'''

        INSERT INTO "{table}"

        ({column_sql})

        VALUES ({value_sql})

    '''





    # --------------------------------------------------------

    # Prepare rows for insertion.

    # --------------------------------------------------------



    migrated_rows = []





    for row in rows:



        source_values = list(row)



        values = list(source_values)





        # ----------------------------------------------------

        # Add values for new target-only columns.

        # ----------------------------------------------------



        for column in explicit_missing_columns:



            value = missing_column_value(

                table,

                column,

                row,

                common_columns,

            )



            values.append(value)





        migrated_rows.append(

            tuple(values)

        )





    # --------------------------------------------------------

    # Insert.

    # --------------------------------------------------------



    target.executemany(

        insert_sql,

        migrated_rows,

    )





    print(

        f"  Migrated rows: {len(migrated_rows)}"

    )





# ============================================================

# VERIFY FOREIGN KEYS

# ============================================================



def verify_foreign_keys(target):



    print("\n" + "=" * 70)

    print("FOREIGN KEY VALIDATION")

    print("=" * 70)





    problems = target.execute(

        "PRAGMA foreign_key_check"

    ).fetchall()





    if problems:



        print(

            "\nWARNING: Foreign-key problems detected:"

        )



        for problem in problems:

            print(" ", problem)





        raise RuntimeError(

            "Foreign-key validation failed."

        )





    print(

        "\nForeign-key validation: PASSED"

    )





# ============================================================

# VERIFY COUNTS

# ============================================================



def verify_counts(source, target):



    print("\n" + "=" * 70)

    print("ROW COUNT VERIFICATION")

    print("=" * 70)





    all_ok = True





    for table in TABLES:



        source_count = source.execute(

            f'SELECT COUNT(*) FROM "{table}"'

        ).fetchone()[0]





        target_count = target.execute(

            f'SELECT COUNT(*) FROM "{table}"'

        ).fetchone()[0]





        if source_count == target_count:



            status = "OK"



        else:



            status = "DIFFERENT"

            all_ok = False





        print(

            f"{table:35}"

            f"SOURCE={source_count:<6}"

            f"TARGET={target_count:<6}"

            f"{status}"

        )





    return all_ok





# ============================================================

# VERIFY IMPORTANT USER ACCOUNT

# ============================================================



def verify_account(target):



    print("\n" + "=" * 70)

    print("ACCOUNT VERIFICATION")

    print("=" * 70)





    email = "sangeethavijayan01@gmail.com"





    user = target.execute(

        """

        SELECT

            id,

            full_name,

            email,

            is_verified,

            is_active,

            role,

            account_tier,

            created_at,

            last_login_at,

            email_notifications_enabled,

            app_notifications_enabled,

            theme

        FROM users

        WHERE lower(email) = lower(?)

        """,

        (email,),

    ).fetchone()





    if not user:



        print(

            f"\nERROR: Account not found: {email}"

        )



        return False





    print("\nACCOUNT FOUND")



    print("ID                         :", user[0])

    print("Full name                  :", user[1])

    print("Email                      :", user[2])

    print("Verified                   :", user[3])

    print("Active                     :", user[4])

    print("Role                       :", user[5])

    print("Account tier               :", user[6])

    print("Created at                 :", user[7])

    print("Last login                 :", user[8])

    print(

        "Email notifications        :",

        user[9],

    )

    print(

        "App notifications          :",

        user[10],

    )

    print("Theme                      :", user[11])





    # --------------------------------------------------------

    # Validate important fields.

    # --------------------------------------------------------



    if not user[4]:



        print(

            "\nWARNING: Account is inactive."

        )





    if not user[3]:



        print(

            "\nWARNING: Account is not verified."

        )





    if not user[6]:



        print(

            "\nERROR: Account tier is empty."

        )



        return False





    print(

        "\nAccount migration check: PASSED"

    )





    return True





# ============================================================

# FINAL DATABASE COUNTS

# ============================================================



def print_final_counts(target):



    print("\n" + "=" * 70)

    print("FINAL DATABASE COUNTS")

    print("=" * 70)





    for table in TABLES:



        count = target.execute(

            f'SELECT COUNT(*) FROM "{table}"'

        ).fetchone()[0]





        print(

            f"{table:35} {count}"

        )





# ============================================================

# MAIN MIGRATION

# ============================================================



def main():



    # --------------------------------------------------------

    # Validate database files.

    # --------------------------------------------------------



    if not CURRENT_DB.exists():



        raise FileNotFoundError(

            f"Current database not found:\n{CURRENT_DB}"

        )





    if not SOURCE_DB.exists():



        raise FileNotFoundError(

            f"Source database not found:\n{SOURCE_DB}"

        )





    # --------------------------------------------------------

    # Prevent accidentally using same database.

    # --------------------------------------------------------



    if CURRENT_DB.resolve() == SOURCE_DB.resolve():



        raise RuntimeError(

            "CURRENT_DB and SOURCE_DB are the same file."

        )





    print("=" * 70)

    print("BUDGETBUDDY DATABASE MIGRATION")

    print("=" * 70)





    print("\nCURRENT DATABASE:")

    print(CURRENT_DB)





    print("\nSOURCE DATABASE:")

    print(SOURCE_DB)





    # --------------------------------------------------------

    # Create backup BEFORE changing current database.

    # --------------------------------------------------------



    print("\nCreating backup...")





    shutil.copy2(

        CURRENT_DB,

        BACKUP_DB,

    )





    print("Backup created:")

    print(BACKUP_DB)





    source = None

    target = None





    try:



        # ----------------------------------------------------

        # Open databases.

        # ----------------------------------------------------



        source = sqlite3.connect(

            SOURCE_DB

        )





        target = sqlite3.connect(

            CURRENT_DB

        )





        # ----------------------------------------------------

        # SQLite settings.

        # ----------------------------------------------------



        source.execute(

            "PRAGMA foreign_keys = ON"

        )





        target.execute(

            "PRAGMA foreign_keys = OFF"

        )





        # ----------------------------------------------------

        # Start ONE transaction.

        # ----------------------------------------------------



        target.execute(

            "BEGIN"

        )





        print(

            "\nClearing existing target data..."

        )





        # Delete child tables first.

        for table in reversed(TABLES):



            target.execute(

                f'DELETE FROM "{table}"'

            )





        print(

            "Existing target data cleared."

        )





        print(

            "\nMigrating source data..."

        )





        # ----------------------------------------------------

        # Migrate every table.

        # ----------------------------------------------------



        for table in TABLES:



            migrate_table(

                source,

                target,

                table,

            )





        # ----------------------------------------------------

        # Verify foreign keys.

        # ----------------------------------------------------



        target.execute(

            "PRAGMA foreign_keys = ON"

        )





        verify_foreign_keys(

            target

        )





        # ----------------------------------------------------

        # Verify source/target row counts.

        # ----------------------------------------------------



        counts_ok = verify_counts(

            source,

            target,

        )





        if not counts_ok:



            raise RuntimeError(

                "One or more table row counts do not match."

            )





        # ----------------------------------------------------

        # Verify important account.

        # ----------------------------------------------------



        account_ok = verify_account(

            target

        )





        if not account_ok:



            raise RuntimeError(

                "Important account verification failed."

            )





        # ----------------------------------------------------

        # Commit ONLY after all checks succeed.

        # ----------------------------------------------------



        target.commit()





        # ----------------------------------------------------

        # WAL checkpoint.

        # ----------------------------------------------------



        try:



            target.execute(

                "PRAGMA wal_checkpoint(FULL)"

            )



        except sqlite3.OperationalError:



            pass





        print("\n" + "=" * 70)

        print("MIGRATION COMPLETED SUCCESSFULLY")

        print("=" * 70)





        print_final_counts(

            target

        )





        print("\nBackup:")

        print(BACKUP_DB)





        print(

            "\nYour original SOURCE database was not modified."

        )





    except Exception as error:



        print("\n" + "=" * 70)

        print("MIGRATION FAILED")

        print("=" * 70)





        print("\nError:")

        print(error)





        if target:



            try:



                target.rollback()



                print(

                    "\nTransaction rolled back."

                )



            except Exception:



                pass





        print(

            "\nBackup of the original target database:"

        )



        print(BACKUP_DB)





        print(

            "\nSOURCE DATABASE WAS NOT MODIFIED."

        )





        raise





    finally:



        if source:



            source.close()





        if target:



            target.close()





# ============================================================

# ENTRY POINT

# ============================================================



if __name__ == "__main__":



    main()