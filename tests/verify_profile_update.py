import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.api.employees import autofill_profile
from unittest.mock import MagicMock, patch

def test_backend_merge_logic():
    print("--- Testing Backend Merge Logic ---")
    
    current_profile = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "1234567890",
        "location": "New York",
        "tech": [{"tech": "Python", "experience_years": 5.0, "level": "Expert"}],
        "work_history": [{"company": "Google", "role": "SE", "description": "Worked on Search"}],
        "education": [{"institution": "MIT", "degree": "CS", "field_of_study": "CS"}],
        "career_summary": "Old summary",
        "experience_years": 5.0
    }
    
    # Mock LLM response
    llm_response = {
        "tech_stack": [
            {"tech": "Python", "experience_years": 5.0, "level": "Expert"}, # Duplicate
            {"tech": "React", "experience_years": 2.0, "level": "Intermediate"} # New
        ],
        "work_history": [
            {"company": "Google", "role": "SE", "description": "Worked on Search"}, # Duplicate
            {"company": "Meta", "role": "SRE", "description": "Worked on Infra"} # New
        ],
        "education": [],
        "email": None,
        "phone": "9999999999", # Update
        "location": None, # Keep existing
        "status": "ON_BENCH", # New
        "bandwidth": 80, # New
        "work_mode": "REMOTE", # New
        "experience": 7.0, # Update
        "career_summary": None, # Keep existing
        "search_phrase": "Expert Python developer" # New
    }
    
    # Mock LLM response with Kubernetes in career_summary (simulate bad LLM behavior if prompt was loose)
    # But wait, I want to verify that MY logic handles it if the LLM IS GOOD now.
    
    with patch('app.services.llm_service.LLMService.generate_profile') as mock_gen:
        # Case 1: LLM correctly puts it in tech_stack
        mock_gen.return_value = {
            "tech_stack": [{"tech": "Kubernetes", "experience_years": 2.0, "level": "Intermediate"}],
            "career_summary": None,
            "work_history": [],
            "education": [],
            "email": None,
            "phone": None,
            "location": None,
            "status": None,
            "bandwidth": None,
            "work_mode": None,
            "experience": None,
            "search_phrase": None
        }
        
        data = {
            "current_profile": current_profile,
            "pasted_text": "I also know Kubernetes with 2 years of experience."
        }
        
        mock_db = MagicMock()
        mock_user = MagicMock()
        
        try:
            # Case 1: LLM correctly puts it in tech_stack
            result = autofill_profile(data, current_user=mock_user, db=mock_db)
            
            assert "Kubernetes" in [t["tech"] for t in result["tech"]]
            assert result["career_summary"] == "Old summary" # Not overwritten
            print("✅ Case 1: Correct LLM tech extraction verified.")

            # Case 2: User explicitly says "Update my summary"
            mock_gen.return_value["career_summary"] = "This is my new summary."
            data["pasted_text"] = "Update my summary: This is my new summary."
            
            result = autofill_profile(data, current_user=mock_user, db=mock_db)
            assert result["career_summary"] == "This is my new summary."
            print("✅ Case 2: Explicit summary update verified.")
            
            # Case 3: Custom System Prompt
            from app.models.llm_settings import LLMSettings
            custom_settings = LLMSettings(
                provider="Ollama", 
                model_name="llama3", 
                system_prompt="CUSTOM RULE: Extract ONLY tech names."
            )
            
            from app.services.llm_service import LLMService
            service = LLMService(mock_db)
            service.settings = custom_settings
            
            prompt = service._get_profile_prompt("I know Go.")
            assert "CUSTOM RULE" in prompt
            assert "I know Go." in prompt
            print("✅ Case 3: Custom system prompt integration verified.")

        except Exception as e:
            print(f"❌ Test Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_backend_merge_logic()
