from pydantic import BaseModel

class LLMSettingsBase(BaseModel):
    provider: str
    model_name: str

class LLMSettingsCreate(LLMSettingsBase):
    pass

class LLMSettingsResponse(LLMSettingsBase):
    id: int

    class Config:
        from_attributes = True
