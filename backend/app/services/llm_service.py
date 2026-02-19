import json
import os
import logging
from openai import OpenAI
from ..models.llm_settings import LLMSettings
from sqlalchemy.orm import Session

class LLMService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)
        self._settings = None

    @property
    def settings(self) -> LLMSettings:
        if self._settings is None:
            try:
                self._settings = self.db.query(LLMSettings).first()
            except Exception as e:
                self.logger.error(f"Error fetching LLM settings: {e}")
                return None
        return self._settings

    def generate_profile(self, partial_data: str) -> dict:
        if not self.settings:
            return self._generate_mock_profile(partial_data)
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

    def generate_search_phrase(self, profile_data: dict) -> str:
        """
        Deterministic, structured summary generation.
        Includes: Name, Location, Bandwidth, Tech, ID, Status, Work Mode, Exp, Work History, Clients.
        """
        name = profile_data.get("name", "Unknown")
        emp_id = profile_data.get("emp_id", "No ID")
        location = profile_data.get("location", "No Location")
        bandwidth = profile_data.get("bandwidth", 0)
        status = profile_data.get("status", "Unknown Status")
        work_mode = profile_data.get("work_mode", "Unknown Mode")
        exp = profile_data.get("experience_years", 0)
        
        # Tech
        tech_list = [t["tech"] for t in profile_data.get("tech", [])]
        tech_str = ", ".join(tech_list) if tech_list else "No specific tech"
        
        # Work History
        history = profile_data.get("work_history", [])
        history_parts = []
        for h in history:
            company = h.get("company", "Unknown")
            role = h.get("role", "Unknown")
            history_parts.append(f"{company} ({role})")
        history_str = "; ".join(history_parts) if history_parts else "No work history"

        # Clients
        clients = profile_data.get("clients", [])
        client_count = len(clients)
        client_details = []
        for c in clients:
            c_name = c.get("client_name", "Unknown")
            c_desc = c.get("description", "")
            # Truncate description if too long
            short_desc = (c_desc[:50] + '..') if len(c_desc) > 50 else c_desc
            client_details.append(f"{c_name} [{short_desc}]")
        
        client_str = f"{client_count} Clients: {', '.join(client_details)}" if clients else "No active clients"

        # Structured Output
        lines = [
            f"{name} ({emp_id}) | {location} | {status} ({work_mode}) | {bandwidth}% Bandwidth",
            f"Exp: {exp} years | Tech: {tech_str}",
            f"History: {history_str}",
            f"Clients: {client_str}"
        ]
        
        return "\n".join(lines)

    def generate_profile_summary(self, profile_data: dict) -> str:
        if not self.settings:
            return self._generate_mock_summary(profile_data)
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

    def parse_jd_with_llm(self, jd_text: str) -> dict:
        """
        Extract structured info from JD using qwen3 (via Ollama).
        """
        if not self.settings:
            return {"required_skills": [], "minimum_experience_years": None, "keywords": []}

        provider = self.settings.provider.lower()
        if provider != "ollama":
            # Per task requirement: Use Ollama with model: qwen3
            # If provider is not ollama, we still try or return empty? 
            # Request says "Use Ollama with model: qwen3". I'll assume qwen3 is configured in settings or use it directly.
            pass

        api_base = self.settings.api_base or "http://localhost:11434/v1"
        client = OpenAI(
            base_url=api_base,
            api_key="ollama", 
        )
        
        prompt = f"""
SYSTEM PROMPT TO QWEN3:

You are a strict information extraction engine.

INPUT:
A Job Description in paragraph format.

TASK:
Extract ONLY explicitly mentioned information.

Return strictly valid JSON in this format:

{{
  "required_skills": [],
  "minimum_experience_years": null,
  "keywords": []
}}

RULES:
- Extract only skills explicitly written.
- If experience like "5+ years" or "minimum 4 years" is present, extract number.
- Do NOT infer.
- Do NOT add extra skills.
- Do NOT explain.
- Output JSON only.

JD CONTENT:
{jd_text}
"""
        
        try:
            response = client.chat.completions.create(
                model="qwen3", # Hardcoded model as per requirement
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            self.logger.error(f"JD Parsing Error: {e}")
            return {"required_skills": [], "minimum_experience_years": None, "keywords": []}

    def compute_match_score(self, profile, parsed_jd: dict) -> dict:
        """
        Scoring logic:
        skill_score = (matched_skills / required_skills) * 0.4
        experience_score = 0.2 if profile.total_experience >= minimum_experience else scaled
        bandwidth_score = 0.2 if bandwidth > 0 else 0
        project_score = normalized project count * 0.1
        client_score = normalized active client count (less overload preferred) * 0.1
        """
        required_skills = [s.lower() for s in parsed_jd.get("required_skills", [])]
        min_exp = parsed_jd.get("minimum_experience_years")
        
        # Skill Score (40%)
        emp_skills = []
        if hasattr(profile, 'tech') and profile.tech:
            emp_skills = [t.get("tech", "").lower() for t in profile.tech]
        
        skill_match_count = 0
        if required_skills:
            skill_match_count = len(set(emp_skills).intersection(set(required_skills)))
            skill_score = (skill_match_count / len(required_skills)) * 0.4
        else:
            skill_score = 0.4 # Default to max if no skills required? Or 0? 
            # JD keywords might have info too
            keywords = [k.lower() for k in parsed_jd.get("keywords", [])]
            if keywords:
                # Fallback to keywords intersection
                emp_text = f"{profile.career_summary or ''} {profile.search_phrase or ''}".lower()
                kw_match_count = sum(1 for kw in keywords if kw in emp_text)
                skill_score = (kw_match_count / len(keywords)) * 0.4

        # Experience Score (20%)
        emp_exp = getattr(profile, 'experience_years', 0.0) or 0.0
        if min_exp is not None and min_exp > 0:
            if emp_exp >= min_exp:
                experience_score = 0.2
            else:
                experience_score = (emp_exp / min_exp) * 0.2
        else:
            experience_score = 0.2 # No min exp required

        # Bandwidth Score (20%)
        bandwidth_score = 0.2 if getattr(profile, 'bandwidth', 0) > 0 else 0

        # Project Score (10%)
        # Normalizing project count: assume 5 projects is a solid "full" score
        work_history_count = len(profile.work_history) if hasattr(profile, 'work_history') and profile.work_history else 0
        project_score = min(work_history_count, 5) / 5 * 0.1

        # Client Score (10%)
        # Lower better. Let's say 0 clients = 0.1, 5+ clients = 0.0
        # If 0 active clients, they are free (on bench), so good for new project.
        client_count = len(profile.clients) if hasattr(profile, 'clients') and profile.clients else 0
        client_score = max(0, (5 - client_count) / 5) * 0.1

        final_score = skill_score + experience_score + bandwidth_score + project_score + client_score
        
        matched_skills_list = list(set(emp_skills).intersection(set(required_skills))) if required_skills else []

        return {
            "match_score": round(final_score * 100, 1),
            "matched_skills": matched_skills_list
        }

    def _generate_openai_profile(self, partial_data: str, api_key: str) -> dict:
        client = OpenAI(api_key=api_key)
        prompt = self._get_profile_prompt(partial_data)
        response = client.chat.completions.create(
            model=self.settings.model_name,
            messages=[
                {"role": "system", "content": "You are a strict structured profile updater."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0,
            top_p=0,
            frequency_penalty=0,
            presence_penalty=0,
            seed=42
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
                    {"role": "system", "content": "You are a strict structured profile updater."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0,
                top_p=0,
                frequency_penalty=0,
                presence_penalty=0,
                seed=42 # For reproducibility
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
        # If user has provided a custom prompt, use it
        if self.settings and self.settings.system_prompt:
            # Replace placeholder if present
            prompt = self.settings.system_prompt
            if "{partial_data}" in prompt:
                return prompt.replace("{partial_data}", partial_data)
            return f"{prompt}\n\nUser Input:\n{partial_data}"

        return f"""
        You will receive:
        New pasted user text: {partial_data}

        Rules:
        Extract ONLY explicitly mentioned information.
        Do NOT infer.
        Do NOT enrich.
        Do NOT rewrite.
        Do NOT remove existing data.
        Do NOT duplicate entries.
        If a section is not mentioned, return null for that field.

        STRICT CAREER SUMMARY RULE:
        - ONLY update career_summary if user explicitly says: "Update my summary...", "Change my profile summary to...", or provides a dedicated professional summary section.
        - Do NOT put skills, experience, or general background text into career_summary. 
        - Skill mentions like "I know Kubernetes" MUST go into tech_stack.

        STRICT TECHNOLOGY EXTRACTION:
        - If a user mentions a technology and experience years, extract it into tech_stack.
        - Format: {{"tech": "...", "experience_years": float, "level": "..."}}

        Return ONLY new data to append.
        Return valid JSON only.
        No explanation text.

        Return this exact structure:
        {{
        "tech_stack": [],
        "work_history": [],
        "education": [],
        "email": null,
        "phone": null,
        "location": null,
        "status": null,
        "bandwidth": null,
        "work_mode": null,
        "experience": null,
        "career_summary": null,
        "search_phrase": null
        }}

        If nothing new → return empty arrays and null values.
        """

    def _get_search_phrase_prompt(self, profile_data: dict) -> str:
        # Format history details for prompt
        history_details = []
        for h in profile_data.get('work_history', []):
            detail = f"- Role: {h.get('role')}"
            if h.get('project'):
                detail += f", Project: {h.get('project')}"
            if h.get('description'):
                detail += f", Work Summary: {h.get('description')}"
            history_details.append(detail)
        
        history_str = "\n".join(history_details[:5])

        return f"""
        Generate a concise indexing search phrase (one short sentence) for this employee:
        - Name: {profile_data.get('name')}
        - Employee ID: {profile_data.get('emp_id')}
        - Technologies: {', '.join([t.get('tech') for t in profile_data.get('tech', [])])}
        - Location: {profile_data.get('location')}
        - Current Status: {profile_data.get('status')}
        - Work Mode: {profile_data.get('work_mode')}
        - Total Experience: {profile_data.get('experience_years')} years
        
        Detailed Work History (Scan for models, roles, and project details):
        {history_str}
        
        ### INSTRUCTIONS:
        1. The phrase should be conversational but DENSE with keywords for search.
        2. Specifically, extract and include roles and models from the description: e.g. Data Analyst, Data Scientist, AI Engineer, ML Engineer, GenAI, LLM.
        3. **MUST include specific models used (e.g. ARIMA, Random Forest, XGBoost, GPT-4) and Project Names.**
        4. Include Work Mode and Status if they add clarity for recruiters.
        
        Example: "John Doe (EMP123), Senior AI Engineer based in Mumbai (REMOTE), with 10 years experience including 'Energy Optimization' using ARIMA and XGBoost models."
        Example: "John Doe (EMP123), Senior AI Engineer based in Mumbai, currently ON_BENCH (HYBRID), with 10 years experience in GenAI/LLM, previously worked on 'Project Alpha' using GPT-4 models at Google."
        """

    def _get_summary_prompt(self, profile_data: dict) -> str:
        return f"""
        Write a professional career summary (3-4 sentences) based on this profile:
        {json.dumps(profile_data, indent=2)}
        """

    def _generate_mock_profile(self, partial_data: str) -> dict:
        """Fallback mock generator - Neutralized for zero hallucination"""
        # Return the exact structure requested by user with nulls/empty arrays
        # to ensure no data is incorrectly mapped if LLM fails.
        return {
            "tech_stack": [],
            "work_history": [],
            "education": [],
            "email": None,
            "phone": None,
            "location": None,
            "status": None,
            "bandwidth": None,
            "work_mode": None,
            "experience": None,
            "career_summary": None,
            "search_phrase": None
        }

    def _generate_mock_summary(self, profile_data: dict) -> str:
        """Neutralized mock summary"""
        return profile_data.get("career_summary", "")

    def fetch_available_models(self, provider: str) -> list:
        provider = provider.lower()
        fallback_ollama = ["llama3", "mistral", "phi3", "gemma"]
        fallback_openai = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
        
        if provider == "ollama":
            try:
                import requests
                api_base = self.settings.api_base if (self.settings and self.settings.api_base) else "http://localhost:11434/v1"
                host = api_base.split("/v1")[0] if "/v1" in api_base else api_base
                response = requests.get(f"{host}/api/tags", timeout=3)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    if models:
                        return [m["name"] for m in models]
            except Exception as e:
                self.logger.error(f"Ollama fetch failed: {e}")
            return fallback_ollama
        elif provider == "openai":
            return fallback_openai
        else:
            return ["mock-model"]
