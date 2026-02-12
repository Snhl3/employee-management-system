from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from ..models.employee import WorkMode, EmployeeStatus
from .history_edu import WorkHistoryCreate, EducationCreate, WorkHistoryResponse, EducationResponse

class EmployeeBase(BaseModel):
    emp_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    tech: Optional[str] = None
    expertise: Optional[str] = None
    level: int = 1
    experience_years: Optional[float] = 0.0
    experience: Optional[float] = None
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
