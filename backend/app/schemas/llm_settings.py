from datetime import datetime
from pydantic import BaseModel

class LLMSettingsBase(BaseModel):
    provider: str
    model_name: str
    api_base: str = "http://localhost:11434/v1"
    api_key: str | None = None

class LLMSettingsCreate(LLMSettingsBase):
    pass

class LLMSettingsResponse(BaseModel):
    id: int
    provider: str
    model_name: str
    api_base: str
    is_api_key_set: bool
    updated_at: datetime

    class Config:
        from_attributes = True
