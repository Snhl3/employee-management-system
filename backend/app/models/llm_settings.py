from sqlalchemy import Column, Integer, String, DateTime
from ..database import Base

class LLMSettings(Base):
    __tablename__ = "llm_settings"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    api_base = Column(String(255), nullable=True, default="http://localhost:11434/v1")
    api_key = Column(String(255), nullable=True)
    system_prompt = Column(String(2000), nullable=True) # Textarea prompt
    updated_at = Column(DateTime, nullable=True)
