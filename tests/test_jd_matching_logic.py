import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.llm_service import LLMService
from app.models.employee import Employee
from unittest.mock import MagicMock

def test_scoring_logic():
    print("Testing Match Scoring Logic...")
    
    # Mock DB session
    db = MagicMock()
    service = LLMService(db)
    
    # Mock Employee
    emp = MagicMock()
    emp.name = "John Doe"
    emp.tech = [{"tech": "Python", "experience_years": 5}, {"tech": "React", "experience_years": 3}]
    emp.experience_years = 8.0
    emp.bandwidth = 100
    emp.work_history = [MagicMock(), MagicMock(), MagicMock()] # 3 projects
    emp.clients = [MagicMock()] # 1 client
    emp.career_summary = "Senior Developer with Python and React expertise."
    emp.search_phrase = "John Doe (EMP001) | NYC | Python/React Developer"

    # Case 1: Perfect match
    parsed_jd = {
        "required_skills": ["Python", "React"],
        "minimum_experience_years": 5,
        "keywords": ["developer", "NYC"]
    }
    
    score_data = service.compute_match_score(emp, parsed_jd)
    print(f"Case 1 (Perfect Match): {score_data['match_score']}%")
    # Skill: 0.4, Exp: 0.2, Bandwidth: 0.2, Projects: 3/5*0.1=0.06, Clients: (5-1)/5*0.1=0.08
    # Total: 0.4 + 0.2 + 0.2 + 0.06 + 0.08 = 0.94 -> 94%
    assert score_data['match_score'] == 94.0

    # Case 2: Partial match
    parsed_jd_v2 = {
        "required_skills": ["Python", "Java"],
        "minimum_experience_years": 10,
        "keywords": []
    }
    score_data_v2 = service.compute_match_score(emp, parsed_jd_v2)
    print(f"Case 2 (Partial Match): {score_data_v2['match_score']}%")
    # Skill: 1/2 * 0.4 = 0.2
    # Exp: 8/10 * 0.2 = 0.16
    # Bandwidth: 0.2
    # Projects: 0.06
    # Clients: 0.08
    # Total: 0.2 + 0.16 + 0.2 + 0.06 + 0.08 = 0.70 -> 70%
    assert score_data_v2['match_score'] == 70.0

    # Case 3: No bandwidth
    emp.bandwidth = 0
    score_data_v3 = service.compute_match_score(emp, parsed_jd)
    print(f"Case 3 (No Bandwidth): {score_data_v3['match_score']}%")
    # Prev was 94%, minus 20% = 74%
    assert score_data_v3['match_score'] == 74.0

    print("All tests passed!")

if __name__ == "__main__":
    test_scoring_logic()
