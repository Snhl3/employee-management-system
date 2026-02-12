from fastapi import APIRouter, Depends, HTTPException, Query
import json
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import employee as models
from ..models import work_history as history_models
from ..models import education as edu_models
from ..schemas import employee as schemas
from .auth_utils import get_current_user
from ..models.user import User
from ..services.llm_service import LLMService

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get("/me", response_model=schemas.EmployeeResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return db_employee

@router.put("/me", response_model=schemas.EmployeeResponse)
def update_my_profile(
    employee_update: schemas.EmployeeCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    return update_employee_record(db_employee, employee_update, db)

@router.put("/{emp_id}", response_model=schemas.EmployeeResponse)
def update_employee(
    emp_id: str,
    employee_update: schemas.EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # In a real app, check for admin privileges here
    db_employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    return update_employee_record(db_employee, employee_update, db)

def update_employee_record(db_employee, employee_update, db):
    # Update flat fields
    for key, value in employee_update.dict(exclude={"work_history", "education"}).items():
        setattr(db_employee, key, value)
    
    # Update work history (simple replace for now)
    db.query(history_models.WorkHistory).filter(history_models.WorkHistory.employee_id == db_employee.id).delete()
    for hist in employee_update.work_history:
        db_employee.work_history.append(history_models.WorkHistory(**hist.dict()))
        
    # Update education (simple replace for now)
    db.query(edu_models.Education).filter(edu_models.Education.employee_id == db_employee.id).delete()
    for edu in employee_update.education:
        db_employee.education.append(edu_models.Education(**edu.dict()))
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.post("/autofill")
def autofill_profile(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    llm_service = LLMService(db)
    try:
        structured_data = llm_service.generate_profile(json.dumps(data))
        return structured_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-summary")
def generate_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    # Serialize profile data for LLM
    profile_data = schemas.EmployeeResponse.from_orm(db_employee).dict()
    
    llm_service = LLMService(db)
    try:
        summary = llm_service.generate_profile_summary(profile_data)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=schemas.EmployeeResponse)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = models.Employee(**employee.dict(exclude={"work_history", "education"}))
    
    for hist in employee.work_history:
        db_employee.work_history.append(models.WorkHistory(**hist.dict()))
    
    for edu in employee.education:
        db_employee.education.append(models.Education(**edu.dict()))
        
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/", response_model=List[schemas.EmployeeResponse])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Employee).offset(skip).limit(limit).all()

@router.get("/search", response_model=List[schemas.EmployeeResponse])
def search_employees(query: str = Query(...), db: Session = Depends(get_db)):
    # Simple search across name, tech, and search_phrase
    return db.query(models.Employee).filter(
        (models.Employee.name.ilike(f"%{query}%")) |
        (models.Employee.tech.ilike(f"%{query}%")) |
        (models.Employee.search_phrase.ilike(f"%{query}%"))
    ).all()

@router.get("/recent", response_model=List[schemas.EmployeeResponse])
def get_recent_updates(limit: int = 5, db: Session = Depends(get_db)):
    return db.query(models.Employee).order_by(models.Employee.last_updated.desc()).limit(limit).all()

@router.get("/{emp_id}", response_model=schemas.EmployeeResponse)
def read_employee(emp_id: str, db: Session = Depends(get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.delete("/{emp_id}")
def delete_employee(emp_id: str, db: Session = Depends(get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_employee)
    db.commit()
    return {"message": "Employee deleted successfully"}
