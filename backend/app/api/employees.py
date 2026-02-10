from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import employee as models
from ..schemas import employee as schemas

router = APIRouter(prefix="/employees", tags=["employees"])

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
