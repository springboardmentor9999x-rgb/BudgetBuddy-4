"""

BudgetBuddy - Controlled Development/Admin Password Reset Utility



Purpose:

    Safely reset the password for a selected existing user during development.



Safety:

    - Only operates on the local BudgetBuddy SQLite database.

    - Creates a backup before modifying the database.

    - Changes ONLY users.hashed_password.

    - Does NOT modify financial data.

    - Does NOT change email, role, account tier, verification, or activity data.

    - Never prints or stores the plaintext password.

"""



import sqlite3

import shutil

import getpass

from pathlib import Path

from datetime import datetime



from app.core.security import hash_password, verify_password





# ============================================================

# CONFIGURATION

# ============================================================



BASE_DIR = Path(__file__).resolve().parent



DATABASE_PATH = BASE_DIR / "budgetbuddy.db"



# Safety: this utility is intended only for this project database.

EXPECTED_DATABASE_NAME = "budgetbuddy.db"





# ============================================================

# DATABASE SAFETY

# ============================================================



def validate_database_path():

    """Ensure we are operating on the intended local database."""



    if DATABASE_PATH.name != EXPECTED_DATABASE_NAME:

        raise RuntimeError(

            "Safety check failed: unexpected database name."

        )



    if not DATABASE_PATH.exists():

        raise FileNotFoundError(

            f"Database not found:\n{DATABASE_PATH}"

        )





def create_backup():

    """Create a timestamped backup before modifying anything."""



    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")



    backup_path = DATABASE_PATH.with_name(

        f"budgetbuddy_before_password_reset_{timestamp}.db"

    )



    shutil.copy2(

        DATABASE_PATH,

        backup_path,

    )



    return backup_path





# ============================================================

# USER HELPERS

# ============================================================



def find_user(connection, email):

    """Find a user by normalized email."""



    return connection.execute(

        """

        SELECT

            id,

            full_name,

            email,

            is_verified,

            is_active,

            role,

            account_tier

        FROM users

        WHERE lower(email) = lower(?)

        """,

        (email.strip(),),

    ).fetchone()





def print_user(user):

    """Display safe user information."""



    print("\nUSER FOUND")

    print("-" * 60)

    print("ID           :", user[0])

    print("Full name    :", user[1])

    print("Email        :", user[2])

    print("Verified     :", user[3])

    print("Active       :", user[4])

    print("Role         :", user[5])

    print("Account tier :", user[6])

    print("-" * 60)





# ============================================================

# FINANCIAL DATA SAFETY CHECK

# ============================================================



def get_financial_counts(connection, user_id):

    """

    Capture financial-data counts before the password change.



    These counts are used only for verification.

    """



    tables = [

        "bank_accounts",

        "income",

        "expense",

        "budget",

        "budget_monthly_allocations",

        "savings_goal",

    ]



    counts = {}



    for table in tables:



        # budget_monthly_allocations has no direct user_id.

        if table == "budget_monthly_allocations":



            count = connection.execute(

                """

                SELECT COUNT(*)

                FROM budget_monthly_allocations bma

                INNER JOIN budget b

                    ON bma.budget_id = b.id

                WHERE b.user_id = ?

                """,

                (user_id,),

            ).fetchone()[0]



        else:



            count = connection.execute(

                f"""

                SELECT COUNT(*)

                FROM "{table}"

                WHERE user_id = ?

                """,

                (user_id,),

            ).fetchone()[0]



        counts[table] = count



    return counts





def compare_counts(before, after):

    """Verify financial-data counts did not change."""



    print("\nFINANCIAL DATA SAFETY CHECK")

    print("-" * 60)



    all_ok = True



    for table in before:



        old_count = before[table]

        new_count = after[table]



        if old_count == new_count:

            status = "OK"

        else:

            status = "CHANGED"

            all_ok = False



        print(

            f"{table:30} "

            f"BEFORE={old_count:<6} "

            f"AFTER={new_count:<6} "

            f"{status}"

        )



    print("-" * 60)



    return all_ok





# ============================================================

# PASSWORD RESET

# ============================================================



def reset_password(connection, user_id, new_password):

    """Update ONLY the user's password hash."""



    new_hash = hash_password(new_password)



    connection.execute(

        """

        UPDATE users

        SET hashed_password = ?

        WHERE id = ?

        """,

        (

            new_hash,

            user_id,

        ),

    )



    return new_hash





# ============================================================

# MAIN

# ============================================================



def main():



    print("=" * 70)

    print("BUDGETBUDDY CONTROLLED PASSWORD RESET")

    print("=" * 70)



    print("\nDatabase:")

    print(DATABASE_PATH)



    # --------------------------------------------------------

    # Safety checks

    # --------------------------------------------------------



    validate_database_path()



    # --------------------------------------------------------

    # Connect

    # --------------------------------------------------------



    connection = sqlite3.connect(

        DATABASE_PATH

    )



    try:



        # Foreign keys enabled.

        connection.execute(

            "PRAGMA foreign_keys = ON"

        )



        # ----------------------------------------------------

        # Request account

        # ----------------------------------------------------



        print("\nEnter the email of the account to reset.")



        email = input(

            "Email: "

        ).strip()



        if not email:

            raise ValueError(

                "Email cannot be empty."

            )



        user = find_user(

            connection,

            email,

        )



        if not user:

            raise ValueError(

                f"No BudgetBuddy user found for: {email}"

            )



        print_user(user)



        # ----------------------------------------------------

        # Explicit confirmation

        # ----------------------------------------------------



        print(

            "\nIMPORTANT:"

        )



        print(

            "This will change ONLY the password hash."

        )



        print(

            "Financial data will NOT be modified."

        )



        confirmation = input(

            "\nType RESET to continue: "

        ).strip()



        if confirmation != "RESET":

            print(

                "\nOperation cancelled."

            )

            return



        # ----------------------------------------------------

        # Password input

        # ----------------------------------------------------



        new_password = getpass.getpass(

            "\nEnter NEW password: "

        )



        confirm_password = getpass.getpass(

            "Confirm NEW password: "

        )



        if new_password != confirm_password:

            raise ValueError(

                "Passwords do not match."

            )



        if not new_password:

            raise ValueError(

                "Password cannot be empty."

            )



        # ----------------------------------------------------

        # Password strength

        # ----------------------------------------------------



        from app.core.security import (

            validate_password_strength

        )



        validate_password_strength(

            new_password

        )



        # ----------------------------------------------------

        # Create backup

        # ----------------------------------------------------



        print(

            "\nCreating database backup..."

        )



        backup_path = create_backup()



        print(

            "Backup created:"

        )

        print(

            backup_path

        )



        # ----------------------------------------------------

        # Financial-data snapshot

        # ----------------------------------------------------



        before_counts = get_financial_counts(

            connection,

            user[0],

        )



        # ----------------------------------------------------

        # Existing user properties

        # ----------------------------------------------------



        original_user_state = connection.execute(

            """

            SELECT

                id,

                full_name,

                email,

                is_verified,

                is_active,

                role,

                account_tier

            FROM users

            WHERE id = ?

            """,

            (user[0],),

        ).fetchone()



        # ----------------------------------------------------

        # Password update

        # ----------------------------------------------------



        print(

            "\nUpdating password..."

        )



        new_hash = reset_password(

            connection,

            user[0],

            new_password,

        )



        # ----------------------------------------------------

        # Verify generated hash before commit

        # ----------------------------------------------------



        if not verify_password(

            new_password,

            new_hash,

        ):

            connection.rollback()



            raise RuntimeError(

                "Password hash verification failed. "

                "Database changes were rolled back."

            )



        # ----------------------------------------------------

        # Commit

        # ----------------------------------------------------



        connection.commit()



        # ----------------------------------------------------

        # Verify user identity/properties

        # ----------------------------------------------------



        updated_user_state = connection.execute(

            """

            SELECT

                id,

                full_name,

                email,

                is_verified,

                is_active,

                role,

                account_tier

            FROM users

            WHERE id = ?

            """,

            (user[0],),

        ).fetchone()



        print(

            "\nACCOUNT PROPERTY CHECK"

        )

        print("-" * 60)



        if original_user_state == updated_user_state:

            print(

                "User properties: UNCHANGED"

            )

        else:

            print(

                "WARNING: User properties changed!"

            )



            raise RuntimeError(

                "Unexpected user-property modification detected."

            )



        # ----------------------------------------------------

        # Financial-data verification

        # ----------------------------------------------------



        after_counts = get_financial_counts(

            connection,

            user[0],

        )



        financial_ok = compare_counts(

            before_counts,

            after_counts,

        )



        if not financial_ok:



            raise RuntimeError(

                "Financial data changed unexpectedly."

            )



        # ----------------------------------------------------

        # Final password verification

        # ----------------------------------------------------



        stored_hash = connection.execute(

            """

            SELECT hashed_password

            FROM users

            WHERE id = ?

            """,

            (user[0],),

        ).fetchone()[0]



        password_ok = verify_password(

            new_password,

            stored_hash,

        )



        print(

            "\nPASSWORD VERIFICATION"

        )

        print("-" * 60)



        if password_ok:

            print(

                "New password verification: PASSED"

            )

        else:

            raise RuntimeError(

                "Final password verification failed."

            )



        # ----------------------------------------------------

        # Final result

        # ----------------------------------------------------



        print("\n" + "=" * 70)

        print("PASSWORD RESET COMPLETED SUCCESSFULLY")

        print("=" * 70)



        print("\nAccount:")

        print(user[2])



        print("\nThe following were preserved:")

        print("  ✓ User ID")

        print("  ✓ Email")

        print("  ✓ Full name")

        print("  ✓ Verification status")

        print("  ✓ Active status")

        print("  ✓ Role")

        print("  ✓ Account tier")

        print("  ✓ Bank accounts")

        print("  ✓ Income")

        print("  ✓ Expenses")

        print("  ✓ Budgets")

        print("  ✓ Monthly budget allocations")

        print("  ✓ Savings goals")



        print("\nBackup:")

        print(backup_path)



        print(

            "\nYou can now log in using the new password."

        )



    except Exception as exc:



        connection.rollback()



        print("\n" + "=" * 70)

        print("PASSWORD RESET FAILED")

        print("=" * 70)



        print(

            "\nReason:"

        )

        print(exc)



        print(

            "\nNo uncommitted database changes were saved."

        )



        raise



    finally:



        connection.close()





if __name__ == "__main__":

    main()