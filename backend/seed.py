import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app.models.base import Employee, WorkMode, EmployeeStatus
from app.models.llm_settings import LLMSettings

def seed():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if created_at exists, if not add it (SQLite specific)
    try:
        db.execute(text("ALTER TABLE employees ADD COLUMN created_at DATETIME"))
        db.commit()
    except Exception:
        db.rollback()
        # Column likely already exists or other error
        pass
        
    try:
        # Check if already seeded (based on LLM settings or a specific count)
        if db.query(LLMSettings).count() > 0:
            print("Database already seeded with settings.")
        else:
            # Add LLM Settings
            llm = LLMSettings(provider="OpenAI", model_name="gpt-4")
            db.add(llm)
            db.commit()

        # Clear existing employees to ensure clean state for seed
        db.query(Employee).delete()
        db.commit()

        # Add Sample Employees
        employees = [
            Employee(
                emp_id="EMP101", name="Kishore Parida", email="kishore@example.com", 
                location="Bhubaneswar", tech=[{"tech": "SQL", "experience_years": 5, "level": "Expert"}],
                level=8, experience_years=5.0, work_mode=WorkMode.OFFICE, 
                status=EmployeeStatus.ON_CLIENT, bandwidth=100, 
                career_summary="Senior Database Specialist with expertise in SQL optimization."
            ),
            Employee(
                emp_id="EMP102", name="Snehal Lawande", email="snehal@example.com", 
                location="Pune", tech=[{"tech": "Python", "experience_years": 4, "level": "Advanced"}, {"tech": "React", "experience_years": 2, "level": "Intermediate"}],
                level=7, experience_years=6.0, work_mode=WorkMode.REMOTE, 
                status=EmployeeStatus.ON_BENCH, bandwidth=100, 
                career_summary="Versatile Fullstack Developer with strong backend foundations in Python.",
                search_phrase="Python and React developer with 6 years experience specializing in Pune-based remote roles."
            )
        ]
        db.add_all(employees)
        db.commit()
        print("Database seeded successfully with Kishore and Snehal!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
