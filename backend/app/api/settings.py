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
        raise HTTPException(status_code=404, detail="LLM settings not found")
    return settings

@router.post("/llm", response_model=schemas.LLMSettingsResponse)
def save_llm_settings(settings: schemas.LLMSettingsCreate, db: Session = Depends(get_db)):
    db_settings = db.query(models.LLMSettings).first()
    if db_settings:
        db_settings.provider = settings.provider
        db_settings.model_name = settings.model_name
    else:
        db_settings = models.LLMSettings(**settings.dict())
        db.add(db_settings)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings
