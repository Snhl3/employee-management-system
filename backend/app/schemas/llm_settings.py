from pydantic import BaseModel

class LLMSettingsBase(BaseModel):
    provider: str
    model_name: str
    api_base: str = "http://localhost:11434/v1"

class LLMSettingsCreate(LLMSettingsBase):
    pass

class LLMSettingsResponse(LLMSettingsBase):
    id: int

    class Config:
        from_attributes = True
