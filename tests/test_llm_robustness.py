
import sys
import os
import json
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.llm_service import LLMService

def test_robustness():
    print("--- Testing LLMService Robustness ---")
    mock_db = MagicMock()
    
    # 1. Test fetch_available_models fallback
    service = LLMService(mock_db)
    service.settings = MagicMock()
    service.settings.provider = "Ollama"
    service.settings.api_base = "http://localhost:11434/v1"
    
    # Mock requests to fail
    with MagicMock() as mock_requests:
        import requests
        requests.get = MagicMock(side_effect=Exception("Connection Refused"))
        models = service.fetch_available_models("Ollama")
        print(f"Models (on failure): {models}")
        assert "llama3" in models
        print("✅ Model fallback verified.")

    # 2. Test prompt formatting with special characters in user prompt
    service.settings.system_prompt = "Rule: {}. User Input: {partial_data}"
    try:
        prompt = service._get_profile_prompt("Some input")
        print(f"Generated prompt: {prompt}")
        assert "Rule: {}" in prompt
        assert "Some input" in prompt
        print("✅ Prompt formatting with {} verified.")
    except KeyError as e:
        print(f"❌ Prompt formatting failed with KeyError: {e}")
    except Exception as e:
        print(f"❌ Prompt formatting failed: {e}")

    # 3. Test missing settings
    service.settings = None
    res = service.generate_profile("pasted text")
    assert res["tech_stack"] == []
    print("✅ Missing settings safety verified.")

if __name__ == "__main__":
    test_robustness()
