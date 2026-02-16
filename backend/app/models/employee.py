from sqlalchemy import Column, Integer, String, Float, Text, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class WorkMode(str, enum.Enum):
    REMOTE = "REMOTE"
    OFFICE = "OFFICE"
    HYBRID = "HYBRID"

class EmployeeStatus(str, enum.Enum):
    ON_BENCH = "ON_BENCH"
    ON_CLIENT = "ON_CLIENT"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    location = Column(String(255))
    tech = Column(JSON)  # Structured tech: [{"tech": "Python", "experience_years": 4, "level": "Advanced"}]
    level = Column(Integer, default=1) # 1-10 Scale
    experience_years = Column(Float, default=0.0)
    work_mode = Column(Enum(WorkMode), default=WorkMode.OFFICE)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ON_BENCH)
    bandwidth = Column(Integer, default=100) # Percentage
    career_summary = Column(Text)
    search_phrase = Column(Text) # For AI-driven search indexing
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    work_history = relationship("WorkHistory", back_populates="employee", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="employee", cascade="all, delete-orphan")
