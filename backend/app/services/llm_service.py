import json
import os
import logging
from openai import OpenAI
from ..models.llm_settings import LLMSettings
from sqlalchemy.orm import Session

class LLMService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = db.query(LLMSettings).first()
        self.logger = logging.getLogger(__name__)

    def generate_profile(self, partial_data: str) -> dict:
        provider = self.settings.provider.lower()
        
        if provider == "ollama":
            return self._generate_ollama_profile(partial_data)
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print("OPENAI_API_KEY not found. Switching to Mock.")
                return self._generate_mock_profile(partial_data)
            return self._generate_openai_profile(partial_data, api_key)
        else:
            # Default to Mock
            return self._generate_mock_profile(partial_data)

    def generate_profile_summary(self, profile_data: dict) -> str:
        provider = self.settings.provider.lower()
        
        if provider == "ollama":
            return self._generate_ollama_summary(profile_data)
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print("OPENAI_API_KEY not found. Switching to Mock.")
                return self._generate_mock_summary(profile_data)
            return self._generate_openai_summary(profile_data, api_key)
        else:
             return self._generate_mock_summary(profile_data)

    def _generate_openai_profile(self, partial_data: str, api_key: str) -> dict:
        client = OpenAI(api_key=api_key)
        prompt = self._get_profile_prompt(partial_data)
        response = client.chat.completions.create(
            model=self.settings.model_name,
            messages=[
                {"role": "system", "content": "You are a strict structured data extractor. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0,
            top_p=0,
            frequency_penalty=0,
            presence_penalty=0
        )
        return json.loads(response.choices[0].message.content)

    def _generate_ollama_profile(self, partial_data: str) -> dict:
        api_base = self.settings.api_base or "http://localhost:11434/v1"
        client = OpenAI(
            base_url=api_base,
            api_key="ollama", 
        )
        
        prompt = self._get_profile_prompt(partial_data)
        
        try:
            response = client.chat.completions.create(
                model=self.settings.model_name,
                messages=[
                    {"role": "system", "content": "You are a strict structured data extractor. Output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0,
                top_p=0,
                frequency_penalty=0,
                presence_penalty=0
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Ollama Error: {e}")
            return self._generate_mock_profile(partial_data)

    def _generate_openai_summary(self, profile_data: dict, api_key: str) -> str:
        client = OpenAI(api_key=api_key)
        prompt = self._get_summary_prompt(profile_data)
        response = client.chat.completions.create(
            model=self.settings.model_name,
            messages=[
                {"role": "system", "content": "You are a professional resume writer."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def _generate_ollama_summary(self, profile_data: dict) -> str:
        import requests
        api_base = self.settings.api_base or "http://localhost:11434/v1"
        client = OpenAI(
            base_url=api_base,
            api_key="ollama",
        )
        prompt = self._get_summary_prompt(profile_data)
        try:
            response = client.chat.completions.create(
                model=self.settings.model_name,
                messages=[
                    {"role": "system", "content": "You are a professional resume writer."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Ollama Error: {e}")
            return self._generate_mock_summary(profile_data)

    def _get_profile_prompt(self, partial_data: str) -> str:
        return f"""
        You are a strict structured data extractor.
        Your job is to extract and map explicitly mentioned information from the provided text into predefined profile fields.
        
        ### EXTRACTION RULES:
        1. Extract ONLY information explicitly present in user input.
        2. Map extracted information to correct profile fields.
        3. DO NOT invent, enrich, assume, or expand anything.
        4. DO NOT rewrite or improve grammar.
        5. DO NOT inject default technologies.
        6. DO NOT assume experience if not mentioned.
        7. DO NOT fabricate company names or education.
        8. If information is missing → leave that field empty.
        
        ### FIELD MAPPING RULES:
        - **Identity**: Name, Email, Phone, Location. Extract exactly as written.
        - **Technologies**: Extract ONLY if mentioned with experience years/level. If no years/level mentioned, DO NOT include tech.
        - **Work History**: Company, Role, Duration, Responsibilities. Use EXACT wording. Do NOT summarize.
        - **Education**: Degree, Institution, Year.
        - **Career Summary**: Extract ONLY the specific "Professional Summary", "Profile", or "Objective" section of the input. DO NOT include job roles, company names, technology lists, or education details in this field. If no dedicated summary is provided, leave this field EMPTY.
        - **Search Phrase**: If user provides a short summary → use that. If not provided → generate short phrase ONLY from existing extracted data (Name - Role).
        
        Input Text:
        {partial_data}
        
        Return structured JSON only:
        {{
            "name": "...",
            "email": "...",
            "phone": "...",
            "location": "...",
            "tech": [
                {{
                    "tech": "...",
                    "experience_years": float,
                    "level": "..."
                }}
            ],
            "level": int,
            "experience_years": float,
            "work_mode": "REMOTE" | "OFFICE" | "HYBRID",
            "status": "ON_BENCH" | "ON_CLIENT",
            "bandwidth": int,
            "career_summary": "...",
            "search_phrase": "...",
            "work_history": [
                {{
                    "company": "...",
                    "role": "...",
                    "start_date": "...",
                    "end_date": "...",
                    "project": "...",
                    "description": "..."
                }}
            ],
            "education": [
                {{
                    "institution": "...",
                    "degree": "...",
                    "field_of_study": "...",
                    "graduation_year": int
                }}
            ]
        }}
        """

    def _get_summary_prompt(self, profile_data: dict) -> str:
        return f"""
        Write a professional career summary (3-4 sentences) based on this profile:
        {json.dumps(profile_data, indent=2)}
        """

    def _generate_mock_profile(self, partial_data: str) -> dict:
        """Fallback mock generator - Neutralized for zero hallucination"""
        try:
            data = json.loads(partial_data) if partial_data.startswith('{') else {"career_summary": partial_data}
            name = data.get("name", "")
            summary = data.get("career_summary", "")
        except:
            name = ""
            summary = partial_data if partial_data else ""
        
        return {
            "name": name,
            "email": "",
            "phone": "",
            "location": "",
            "tech": [],
            "level": 1,
            "experience_years": 0.0,
            "work_mode": "OFFICE",
            "status": "ON_BENCH",
            "bandwidth": 100,
            "career_summary": summary,
            "search_phrase": "",
            "work_history": [],
            "education": []
        }

    def _generate_mock_summary(self, profile_data: dict) -> str:
        """Neutralized mock summary"""
        return profile_data.get("career_summary", "")

    def fetch_available_models(self, provider: str) -> list:
        provider = provider.lower()
        if provider == "ollama":
            try:
                import requests
                # Use settings.api_base or default
                api_base = self.settings.api_base if (self.settings and self.settings.api_base) else "http://localhost:11434/v1"
                # Extract host from api_base (strip /v1)
                host = api_base.split("/v1")[0]
                response = requests.get(f"{host}/api/tags", timeout=5)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return [m["name"] for m in models]
            except Exception as e:
                print(f"Ollama fetch failed: {e}")
            return ["llama3", "mistral", "phi3"] # Fallback
        elif provider == "openai":
            # Return curated list of popular models
            return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
        else:
            return ["mock-model"]
