
import sys
import os
import logging

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.llm_service import LLMService
from app.database import Base

def debug_fetch():
    print("--- Debugging Model Fetching ---")
    engine = create_engine("sqlite:///./test_debug.db")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        service = LLMService(db)
        print("Calling fetch_available_models...")
        models = service.fetch_available_models("Ollama")
        print(f"Success! Models: {models}")
    except Exception as e:
        print(f"FAILED with unexpected error")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_fetch()
