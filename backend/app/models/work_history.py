from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base

class WorkHistory(Base):
    __tablename__ = "work_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True) # Null if current job
    description = Column(Text)

    employee = relationship("Employee", back_populates="work_history")
