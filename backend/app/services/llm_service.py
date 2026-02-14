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
                {"role": "system", "content": "You are a professional HR assistant. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)

    def _generate_ollama_profile(self, partial_data: str) -> dict:
        import requests
        api_base = self.settings.api_base or "http://localhost:11434/v1"
        # Ensure api_base doesn't end with slash if we append /chat/completions manually, 
        # but OpenAI client handles it if we use that. 
        # Actually, let's use OpenAI client pointed to Ollama for compatibility!
        
        client = OpenAI(
            base_url=api_base,
            api_key="ollama", # required but ignored
        )
        
        prompt = self._get_profile_prompt(partial_data)
        
        try:
            response = client.chat.completions.create(
                model=self.settings.model_name,
                messages=[
                    {"role": "system", "content": "You are a professional HR assistant. Output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                # Ollama JSON mode might vary, but let's try standard response_format
                response_format={ "type": "json_object" }
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
        You are an AI assistant helping to complete an employee profile.
        Given the following text, extract and generate a structured JSON object.
        
        Input Text:
        {partial_data}
        
        JSON Structure (Return ONLY JSON):
        {{
            "name": "...",
            "email": "...",
            "phone": "...",
            "location": "...",
            "tech": [
                {{
                    "tech": "Python",
                    "experience_years": 4.0,
                    "level": "Advanced"
                }},
                {{
                    "tech": "React",
                    "experience_years": 2.0,
                    "level": "Intermediate"
                }}
            ],
            "level": int (1-10),
            "experience_years": float,
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
                    "end_date": "YYYY-MM-DD" or null,
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
        
        IMPORTANT: For "tech", extract technology names with estimated experience years and proficiency level.
        Level must be one of: "Beginner", "Intermediate", "Advanced", "Expert"
        """

    def _get_summary_prompt(self, profile_data: dict) -> str:
        return f"""
        Write a professional career summary (3-4 sentences) based on this profile:
        {json.dumps(profile_data, indent=2)}
        """

    def _generate_mock_profile(self, partial_data: str) -> dict:
        """Fallback mock generator"""
        # ... (Existing Mock Logic) ...
        try:
            data = json.loads(partial_data)
            name = data.get("name", "Mock User")
            summary = data.get("career_summary", "")
        except:
            name = "Mock User"
            summary = ""

        first_name = name.split()[0] if name else "User"
        
        return {
            "name": name,
            "email": f"{first_name.lower()}@example.com",
            # ... rest of mock data ...
            "phone": "+1 (555) 0123-456",
            "location": "San Francisco, CA",
            "tech": [
                {"tech": "Python", "experience_years": 4.0, "level": "Advanced"},
                {"tech": "React", "experience_years": 3.0, "level": "Advanced"},
                {"tech": "FastAPI", "experience_years": 2.5, "level": "Intermediate"},
                {"tech": "TypeScript", "experience_years": 3.0, "level": "Advanced"},
                {"tech": "AWS", "experience_years": 2.0, "level": "Intermediate"},
                {"tech": "Docker", "experience_years": 2.0, "level": "Intermediate"},
                {"tech": "PostgreSQL", "experience_years": 3.5, "level": "Advanced"},
                {"tech": "Redis", "experience_years": 1.5, "level": "Beginner"}
            ],
            "level": 7,
            "experience_years": 5.5,
            "work_mode": "REMOTE",
            "status": "ON_CLIENT",
            "bandwidth": 100,
            "career_summary": summary or f"Experienced {name} with a demonstrated history of working in the software industry. Skilled in React, Python, and Cloud technologies.",
            "search_phrase": f"{name} Full Stack Developer React Python",
            "work_history": [
                {
                    "company": "Tech Corp Inc.",
                    "role": "Senior Developer",
                    "start_date": "2021-01-15",
                    "end_date": None,
                    "project": "Cloud Migration",
                    "description": "Leading the migration of legacy monoliths to microservices architecture using FastAPI and AWS."
                },
                {
                    "company": "StartupX",
                    "role": "Software Engineer",
                    "start_date": "2018-06-01",
                    "end_date": "2020-12-31",
                    "project": "MVP Development",
                    "description": "Developed the initial MVP using React and Node.js. Optimized database queries reducing load times by 40%."
                }
            ],
            "education": [
                {
                    "institution": "University of Technology",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "graduation_year": 2018
                }
            ]
        }

    def _generate_mock_summary(self, profile_data: dict) -> str:
        # ... (Existing Mock Logic) ...
        name = profile_data.get("name", "The professional")
        tech = profile_data.get("tech", "modern technologies")
        role = "Software Engineer"
        if profile_data.get("work_history"):
             role = profile_data["work_history"][0].get("role", "Software Engineer")
             
        return f"{name} is a highly engaged {role} specializing in {tech}. They have a strong track record of delivering high-quality solutions and driving technical excellence. Proven ability to adapt to new challenges and collaborate effectively in dynamic environments."

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
