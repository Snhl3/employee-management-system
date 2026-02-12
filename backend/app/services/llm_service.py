import json
import os
from openai import OpenAI
from ..models.llm_settings import LLMSettings
from sqlalchemy.orm import Session

class LLMService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = db.query(LLMSettings).first()

    def generate_profile(self, partial_data: str) -> dict:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise Exception("OPENAI_API_KEY not configured on server")

        client = OpenAI(api_key=api_key)
        
        prompt = f"""
        You are an AI assistant helping to complete an employee profile for an Employee Management System.
        Given the following partial information or text description of an employee, generate a structured JSON object.
        
        Partial Information:
        {partial_data}
        
        The JSON should follow this structure (all fields are strings unless specified):
        {{
            "name": "...",
            "email": "...",
            "phone": "...",
            "location": "...",
            "tech": "...",
            "expertise": "...",
            "level": "...",
            "experience": float,
            "work_mode": "REMOTE" or "OFFICE",
            "status": "ON_BENCH" or "ON_CLIENT",
            "bandwidth": int (0-100),
            "career_summary": "...",
            "search_phrase": "...",
            "work_history": [
                {{
                    "company": "...",
                    "role": "...",
                    "start_date": "YYYY-MM-DD",
                    "end_date": "YYYY-MM-DD or null",
                    "description": "..."
                }}
            ],
            "education": [
                {{
                    "institution": "...",
                    "degree": "...",
                    "field_of_study": "...",
                    "start_date": "YYYY-MM-DD",
                    "end_date": "YYYY-MM-DD or null"
                }}
            ]
        }}
        
        Return ONLY the JSON object.
        """

        response = client.chat.completions.create(
            model=self.settings.model_name,
            messages=[
                {{"role": "system", "content": "You are a professional HR assistant."}},
                {{"role": "user", "content": prompt}}
            ],
            response_format={{ "type": "json_object" }}
        )

        return json.loads(response.choices[0].message.content)

    def generate_profile_summary(self, profile_data: dict) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise Exception("OPENAI_API_KEY not configured on server")

        client = OpenAI(api_key=api_key)

        prompt = f"""
        You are a professional resume writer. Based on the following employee profile data, write a compelling and professional career summary (approx. 3-4 sentences).
        Focus on their role, key skills, and experience. Do not invent facts, just synthesize the provided info.

        Profile Data:
        {json.dumps(profile_data, indent=2)}

        Return ONLY the summary text.
        """

        response = client.chat.completions.create(
            model=self.settings.model_name,
            messages=[
                {"role": "system", "content": "You are a professional resume writer."},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content.strip()
