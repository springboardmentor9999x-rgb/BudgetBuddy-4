from datetime import datetime



from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime

from sqlalchemy.orm import relationship



from app.database import Base





class SavingsGoal(Base):

    __tablename__ = "savings_goal"



    id = Column(

        Integer,

        primary_key=True,

        index=True,

    )



    user_id = Column(

        Integer,

        ForeignKey("users.id"),

        nullable=False,

        index=True,

    )



    goal_name = Column(

        String,

        nullable=False,

    )



    target_amount = Column(

        Float,

        nullable=False,

    )



    saved_amount = Column(

        Float,

        default=0.0,

        nullable=False,

    )



    created_at = Column(

        DateTime,

        default=datetime.utcnow,

        nullable=False,

    )



    updated_at = Column(

        DateTime,

        default=datetime.utcnow,

        onupdate=datetime.utcnow,

        nullable=False,

    )



    owner = relationship(

        "User",

        back_populates="savings_goals",

    )