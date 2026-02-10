import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.employee import Employee, WorkMode, EmployeeStatus
from app.models.llm_settings import LLMSettings

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Employee).count() > 0:
            print("Database already seeded.")
            return

        # Add LLM Settings
        llm = LLMSettings(provider="OpenAI", model_name="gpt-4")
        db.add(llm)

        # Add Sample Employees
        employees = [
            Employee(
                emp_id="EMP001", name="Alice Johnson", email="alice@example.com", 
                location="New York", tech="React, TypeScript", expertise="Frontend Architecture",
                level="Senior", experience=8.5, work_mode=WorkMode.REMOTE, 
                status=EmployeeStatus.ON_CLIENT, bandwidth=100, search_phrase="Expert frontend developer with React knowledge"
            ),
            Employee(
                emp_id="EMP002", name="Bob Smith", email="bob@example.com", 
                location="San Francisco", tech="Python, FastAPI, AWS", expertise="Backend & DevOps",
                level="Lead", experience=12.0, work_mode=WorkMode.OFFICE, 
                status=EmployeeStatus.ON_BENCH, bandwidth=100, search_phrase="Lead backend engineer specialized in cloud"
            ),
            Employee(
                emp_id="EMP003", name="Charlie Davis", email="charlie@example.com", 
                location="Austin", tech="Vue.js, Node.js", expertise="Fullstack Development",
                level="Mid", experience=4.0, work_mode=WorkMode.REMOTE, 
                status=EmployeeStatus.ON_BENCH, bandwidth=50, search_phrase="Fullstack developer with Vue and Node experience"
            )
        ]
        db.add_all(employees)
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
