"""convert_tech_to_structured_format

Revision ID: f6ea82b92e07
Revises: 28410aeed834
Create Date: 2026-02-13 23:24:02.490379

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'f6ea82b92e07'
down_revision: Union[str, None] = '28410aeed834'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert tech from simple array to structured format
    # From: ["React", "Python"]
    # To: [{"tech": "React", "experience_years": 0, "level": "Beginner"}, ...]
    
    connection = op.get_bind()
    
    # Fetch all employees with their current tech values
    result = connection.execute(sa.text("SELECT id, tech FROM employees"))
    for row in result:
        emp_id = row[0]
        tech_json = row[1]
        
        if tech_json:
            try:
                # Parse existing tech array
                tech_array = json.loads(tech_json) if isinstance(tech_json, str) else tech_json
                
                # Convert to structured format
                if isinstance(tech_array, list) and len(tech_array) > 0:
                    # Check if already structured
                    if isinstance(tech_array[0], dict) and 'tech' in tech_array[0]:
                        # Already structured, skip
                        continue
                    
                    # Convert simple strings to structured format
                    structured_tech = []
                    for tech_name in tech_array:
                        if isinstance(tech_name, str):
                            structured_tech.append({
                                "tech": tech_name,
                                "experience_years": 0,
                                "level": "Beginner"
                            })
                    
                    # Update with structured format
                    connection.execute(
                        sa.text("UPDATE employees SET tech = :tech_json WHERE id = :emp_id"),
                        {"tech_json": json.dumps(structured_tech), "emp_id": emp_id}
                    )
            except Exception as e:
                print(f"Error converting tech for employee {emp_id}: {e}")
                continue


def downgrade() -> None:
    # Convert structured tech back to simple array
    connection = op.get_bind()
    
    result = connection.execute(sa.text("SELECT id, tech FROM employees"))
    for row in result:
        emp_id = row[0]
        tech_json = row[1]
        
        if tech_json:
            try:
                tech_array = json.loads(tech_json) if isinstance(tech_json, str) else tech_json
                
                if isinstance(tech_array, list) and len(tech_array) > 0:
                    # Check if structured
                    if isinstance(tech_array[0], dict) and 'tech' in tech_array[0]:
                        # Extract just the tech names
                        simple_tech = [item['tech'] for item in tech_array if isinstance(item, dict) and 'tech' in item]
                        
                        connection.execute(
                            sa.text("UPDATE employees SET tech = :tech_json WHERE id = :emp_id"),
                            {"tech_json": json.dumps(simple_tech), "emp_id": emp_id}
                        )
            except Exception as e:
                print(f"Error converting tech for employee {emp_id}: {e}")
                continue

