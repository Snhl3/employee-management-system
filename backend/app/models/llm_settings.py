from sqlalchemy import Column, Integer, String
from ..database import Base

class LLMSettings(Base):
    __tablename__ = "llm_settings"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    api_base = Column(String(255), nullable=True, default="http://localhost:11434/v1")
