from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from ..models.employee import WorkMode, EmployeeStatus
from .history_edu import WorkHistoryCreate, EducationCreate, WorkHistoryResponse, EducationResponse

class TechExperience(BaseModel):
    tech: str
    experience_years: float
    level: str  # Beginner, Intermediate, Advanced, Expert

class EmployeeBase(BaseModel):
    emp_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    tech: Optional[List[TechExperience]] = None  # Structured tech with experience and level
    level: int = 1
    experience_years: Optional[float] = 0.0
    work_mode: WorkMode = WorkMode.OFFICE
    status: EmployeeStatus = EmployeeStatus.ON_BENCH
    bandwidth: int = 100
    career_summary: Optional[str] = None
    search_phrase: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    work_history: List[WorkHistoryCreate] = []
    education: List[EducationCreate] = []

class EmployeeResponse(EmployeeBase):
    id: int
    last_updated: datetime
    work_history: List[WorkHistoryResponse] = []
    education: List[EducationResponse] = []

    class Config:
        from_attributes = True
