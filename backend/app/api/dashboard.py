from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.employee import Employee, EmployeeStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    on_bench = db.query(Employee).filter(Employee.status == EmployeeStatus.ON_BENCH).count()
    on_client = db.query(Employee).filter(Employee.status == EmployeeStatus.ON_CLIENT).count()
    
    return {
        "total_employees": total_employees,
        "on_bench": on_bench,
        "billable": on_client,
        "bench_percentage": (on_bench / total_employees * 100) if total_employees > 0 else 0
    }
