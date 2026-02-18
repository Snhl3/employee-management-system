from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Literal
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

class Client(BaseModel):
    client_name: str
    client_status: Literal["Active", "Completed", "Pipeline"]
    description: str

    @field_validator("description")
    @classmethod
    def validate_description_word_count(cls, v):
        word_count = len(v.split())
        if word_count > 150:
            raise ValueError(f"Description must not exceed 150 words (got {word_count})")
        return v

class EmployeeCreate(EmployeeBase):
    work_history: List[WorkHistoryCreate] = []
    education: List[EducationCreate] = []
    clients: List[Client] = []

class EmployeeResponse(EmployeeBase):
    id: int
    last_updated: datetime
    work_history: List[WorkHistoryResponse] = []
    education: List[EducationResponse] = []
    clients: List[Client] = []
    match_score: Optional[float] = None

    class Config:
        from_attributes = True
