from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    institution = Column(String(255), nullable=False)
    degree = Column(String(255))
    field_of_study = Column(String(255))
    graduation_year = Column(Integer)

    employee = relationship("Employee", back_populates="education")
