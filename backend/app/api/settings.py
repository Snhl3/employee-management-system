import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import llm_settings as models
from ..schemas import llm_settings as schemas

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/llm", response_model=schemas.LLMSettingsResponse)
def get_llm_settings(db: Session = Depends(get_db)):
    settings = db.query(models.LLMSettings).first()
    if not settings:
        # Return default values if no record exists
        return {
            "id": 0,
            "provider": "Ollama",
            "model_name": "llama3",
            "api_base": "http://localhost:11434/v1",
            "is_api_key_set": False,
            "updated_at": datetime.now()
        }
    
    return {
        "id": settings.id,
        "provider": settings.provider,
        "model_name": settings.model_name,
        "api_base": settings.api_base,
        "system_prompt": settings.system_prompt,
        "is_api_key_set": bool(settings.api_key),
        "updated_at": settings.updated_at
    }

@router.post("/llm", response_model=schemas.LLMSettingsResponse)
def save_llm_settings(settings: schemas.LLMSettingsCreate, db: Session = Depends(get_db)):
    logger = logging.getLogger(__name__)
    logger.info(f"Saving LLM settings for provider: {settings.provider}")
    db_settings = db.query(models.LLMSettings).first()
    if db_settings:
        db_settings.provider = settings.provider
        db_settings.model_name = settings.model_name
        db_settings.api_base = settings.api_base
        db_settings.system_prompt = settings.system_prompt
        if settings.api_key:
            db_settings.api_key = settings.api_key
        db_settings.updated_at = datetime.now()
    else:
        db_settings = models.LLMSettings(**settings.model_dump())
        db.add(db_settings)
    
    db.commit()
    db.refresh(db_settings)
    
    return {
        "id": db_settings.id,
        "provider": db_settings.provider,
        "model_name": db_settings.model_name,
        "api_base": db_settings.api_base,
        "system_prompt": db_settings.system_prompt,
        "is_api_key_set": bool(db_settings.api_key),
        "updated_at": db_settings.updated_at
    }

@router.get("/llm/models")
def get_llm_models(provider: str, db: Session = Depends(get_db)):
    from ..services.llm_service import LLMService
    try:
        llm_service = LLMService(db)
        models_list = llm_service.fetch_available_models(provider)
        return models_list
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to fetch models: {e}")
        # Maximum safety fallback
        if provider.lower() == "openai":
            return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
        return ["llama3", "mistral", "phi3", "gemma"]
