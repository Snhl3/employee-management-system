from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
import json
import io
import pypdf
import docx
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import employee as models
from ..models import work_history as history_models
from ..models import education as edu_models
from ..schemas import employee as schemas
from .auth_utils import get_current_user
from ..models.user import User, UserRole
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
    # Admins can edit any profile. Regular users can only edit their own profile (if emp_id matches or via /me endpoint).
    db_employee = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    if current_user.role != UserRole.ADMIN:
        # Check if the employee record belongs to the current user
        if db_employee.email != current_user.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this profile."
            )
    
    print(f"DEBUG: Admin {current_user.email} is editing profile {db_employee.email}")

    return update_employee_record(db_employee, employee_update, db)

def update_employee_record(db_employee, employee_update, db):
    print(f"DEBUG: Updating employee record for ID: {db_employee.emp_id}")
    # Update flat fields (exclude relational and JSON-array fields)
    update_data = employee_update.model_dump(exclude={"work_history", "education", "clients"})
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    # Update clients (JSON column)
    db_employee.clients = [c.model_dump() for c in employee_update.clients]

    # Update work history (simple replace)
    db.query(history_models.WorkHistory).filter(history_models.WorkHistory.employee_id == db_employee.id).delete()
    for hist in employee_update.work_history:
        db_employee.work_history.append(history_models.WorkHistory(**hist.model_dump()))
        
    # Update education (simple replace)
    db.query(edu_models.Education).filter(edu_models.Education.employee_id == db_employee.id).delete()
    for edu in employee_update.education:
        db_employee.education.append(edu_models.Education(**edu.model_dump()))
        
    db_employee.last_updated = datetime.now()
    db.commit()
    db.refresh(db_employee)
    return db_employee

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

@router.post("/generate-search-phrase")
def generate_search_phrase(profile_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    llm_service = LLMService(db)
    try:
        phrase = llm_service.generate_search_phrase(profile_data)
        return {"search_phrase": phrase}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=schemas.EmployeeResponse)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = models.Employee(**employee.dict(exclude={"work_history", "education", "clients"}))
    
    for hist in employee.work_history:
        db_employee.work_history.append(models.WorkHistory(**hist.dict()))
    
    for edu in employee.education:
        db_employee.education.append(models.Education(**edu.dict()))
    
    # Clients are JSON, so we can just assign if using Pydantic V2 or handle manual list
    if employee.clients:
        db_employee.clients = [c.dict() for c in employee.clients]

    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/", response_model=List[schemas.EmployeeResponse])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Employee).offset(skip).limit(limit).all()

@router.get("/search", response_model=List[schemas.EmployeeResponse])
def search_employees(
    query: str = Query(None), 
    name: str = Query(None),
    tech: str = Query(None),
    status: str = Query(None),
    bandwidth: str = Query(None),
    experience: str = Query(None),
    jd: str = Query(None),  # Job Description for matching
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Access Control: If not Admin, return ONLY own profile (if matches)
    if current_user.role != UserRole.ADMIN:
        # We search specifically for the current user's employee record
        # and apply filters to it. If it matches, return [it], else [].
        base_query = db.query(models.Employee).filter(models.Employee.email == current_user.email)
    else:
        base_query = db.query(models.Employee)

    # Apply Filters
    if query:
        search_filter = f"%{query}%"
        base_query = base_query.filter(
            (models.Employee.name.ilike(search_filter)) |
            (models.Employee.emp_id.ilike(search_filter)) |
            (models.Employee.location.ilike(search_filter)) |
            (models.Employee.career_summary.ilike(search_filter)) |
            (models.Employee.search_phrase.ilike(search_filter)) |
            (models.Employee.tech.cast(models.Text).ilike(search_filter))
        )
    
    if name:
        base_query = base_query.filter(models.Employee.name.ilike(f"%{name}%"))
    
    if tech:
        # Simple text match on JSON column cast to text
        base_query = base_query.filter(models.Employee.tech.cast(models.Text).ilike(f"%{tech}%"))
        
    if status:
        base_query = base_query.filter(models.Employee.status == status)

    if bandwidth:
        try:
            bw_val = int(bandwidth)
            base_query = base_query.filter(models.Employee.bandwidth >= bw_val)
        except ValueError:
            pass
            
    if experience:
        try:
            exp_val = float(experience)
            base_query = base_query.filter(models.Employee.experience_years >= exp_val)
        except ValueError:
            pass

    results = base_query.all()
    
    # ---------------------------------------------------------
    # JD Scoring & Sorting Logic
    # ---------------------------------------------------------
    if jd and results:
        import re
        # Tokenize JD: remove punctuation, lowercase, split
        # We look for words > 2 chars to avoid noise
        jd_text = jd.lower()
        jd_keywords = set(re.findall(r'\b[a-z]{3,}\b', jd_text))
        
        scored_results = []
        for emp in results:
            score = 0
            
            # Helper to check text overlap
            def count_matches(source_text, keywords):
                if not source_text:
                    return 0
                tokens = set(re.findall(r'\b[a-z]{3,}\b', source_text.lower()))
                return len(keywords.intersection(tokens))

            # 1. High Weight: Tech Stack & Search Phrase (3 pts per match)
            tech_str = " ".join([t.get("tech", "") for t in emp.tech]) if emp.tech else ""
            score += count_matches(tech_str, jd_keywords) * 3
            score += count_matches(emp.search_phrase, jd_keywords) * 3
            
            # 2. Medium Weight: Career Summary (2 pts per match)
            score += count_matches(emp.career_summary, jd_keywords) * 2
            
            # 3. Low Weight: Work History & Clients (1 pt per match)
            work_str = ""
            if emp.work_history:
                work_str += " ".join([f"{h.description} {h.role} {h.project}" for h in emp.work_history])
            if emp.clients:
                client_str = " ".join([c.get("description", "") for c in emp.clients])
                work_str += " " + client_str
            
            score += count_matches(work_str, jd_keywords) * 1
            
            scored_results.append((score, emp))
        
        # Sort by score desc
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [x[1] for x in scored_results]

    # ---------------------------------------------------------
    # Basic Search Sorting
    # ---------------------------------------------------------
    # If no JD, but we have a query, prioritize exact name/phrase matches
    if query and results:
        q_lower = query.lower()
        def basic_rank(emp):
            # Rank 1 (Top): Exact Name or Emp ID match
            if emp.name.lower() == q_lower or emp.emp_id.lower() == q_lower:
                return 100
            # Rank 2: Query in Name
            if q_lower in emp.name.lower():
                return 80
            # Rank 3: Query in Search Phrase
            if emp.search_phrase and q_lower in emp.search_phrase.lower():
                return 60
            # Rank 4: Query in Tech
            tech_str = " ".join([t.get("tech", "") for t in emp.tech]) if emp.tech else ""
            if q_lower in tech_str.lower():
                return 40
            return 0
            
        results.sort(key=basic_rank, reverse=True)

    return results

@router.get("/recent", response_model=List[schemas.EmployeeResponse])
def get_recent_updates(limit: int = 5, db: Session = Depends(get_db)):
    # Sort by created_at to show recently ADDED profiles
    return db.query(models.Employee).order_by(models.Employee.created_at.desc()).limit(limit).all()

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
