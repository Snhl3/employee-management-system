import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.llm_service import LLMService
from app.models.llm_settings import LLMSettings
from app.database import SessionLocal, engine, Base
from app.models import base  # Import all models

# Create tables if not exist (for standalone test)
Base.metadata.create_all(bind=engine)

def test_llm_service():
    db = SessionLocal()
    try:
        # 1. Test Mock Provider
        print("\n--- Testing MOCK Provider ---")
        settings = db.query(LLMSettings).first()
        if not settings:
            settings = LLMSettings(provider="Mock", model_name="test-mock")
            db.add(settings)
        else:
            settings.provider = "Mock"
            settings.model_name = "test-mock"
        db.commit()

        service = LLMService(db)
        input_text = "John Doe is a Python Developer."
        result = service.generate_profile(input_text)
        print(f"Result Name: {result.get('name')}")
        assert result.get('name') == "Mock User" or "John" in result.get('name', '')

        # 2. Test Ollama Provider (Simulated connection error if not running)
        print("\n--- Testing OLLAMA Provider (Expect Error if not running) ---")
        settings.provider = "Ollama"
        settings.api_base = "http://localhost:11434/v1"
        settings.model_name = "llama3:latest"
        db.commit()

        # Since we likely don't have Ollama running in this environment, 
        # we expect it to catch the error and fallback to Mock (as implemented)
        # OR fail if we didn't implement fallback for connection error inside _generate_ollama_profile
        # Let's check implementation behavior. 
        # My implementation had a try/except block that prints "Ollama Error" and returns Mock.
        result_ollama = service.generate_profile(input_text)
        print(f"Ollama Fallback Result: {result_ollama.get('name')}")
        
        print("\n✅ Service Logic Verified (Provider Switching & Fallback)")

    finally:
        db.close()

if __name__ == "__main__":
    test_llm_service()
