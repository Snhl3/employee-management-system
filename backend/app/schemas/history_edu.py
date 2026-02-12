from pydantic import BaseModel
from typing import Optional
from datetime import date

class WorkHistoryBase(BaseModel):
    company: str
    role: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    project: Optional[str] = None
    description: Optional[str] = None

class WorkHistoryCreate(WorkHistoryBase):
    pass

class WorkHistoryResponse(WorkHistoryBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None

class EducationCreate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True
