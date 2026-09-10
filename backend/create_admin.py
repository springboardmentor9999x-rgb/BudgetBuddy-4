from app.database import SessionLocal

from app.models.user import User

from app.core.security import hash_password



ADMIN_EMAIL = "admin.buddybudget01@gmail.com"

ADMIN_PASSWORD = "BudgetBuddy@123"



db = SessionLocal()



try:

    user = (

        db.query(User)

        .filter(User.email == ADMIN_EMAIL.lower())

        .first()

    )



    if user is None:

        print("Admin email does not exist.")

        print("Create the account normally first, then run this script again.")

    else:

        user.role = "admin"

        user.is_verified = True

        user.is_active = True

        user.hashed_password = hash_password(ADMIN_PASSWORD)



        db.commit()

        db.refresh(user)



        print("================================")

        print("ADMIN ACCOUNT READY")

        print("Email:", user.email)

        print("Role:", user.role)

        print("Verified:", user.is_verified)

        print("Active:", user.is_active)

        print("================================")



finally:

    db.close()