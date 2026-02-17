import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_settings_persistence():
    print("Testing settings persistence...")
    # 1. Get current settings
    response = requests.get(f"{BASE_URL}/settings/llm")
    if response.status_code != 200:
        print(f"Failed to get settings: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    settings = response.data if hasattr(response, 'data') else response.json()
    original_prompt = settings.get("system_prompt", "")
    new_prompt = f"Test prompt {json.dumps(original_prompt)}"
    
    # 2. Update settings
    settings["system_prompt"] = new_prompt
    # Remove computed fields
    settings.pop("id", None)
    settings.pop("is_api_key_set", None)
    settings.pop("updated_at", None)
    
    update_resp = requests.post(f"{BASE_URL}/settings/llm", json=settings)
    if update_resp.status_code != 200:
        print(f"Failed to update settings: {update_resp.status_code}")
        return
    
    # 3. Verify settings
    verify_resp = requests.get(f"{BASE_URL}/settings/llm")
    verified_settings = verify_resp.json()
    if verified_settings.get("system_prompt") == new_prompt:
        print("Settings persistence verified!")
    else:
        print(f"Settings mismatch! Expected {new_prompt}, got {verified_settings.get('system_prompt')}")

def test_parsing_flow():
    print("\nTesting parsing flow...")
    test_profile = {
        "name": "Test User",
        "tech": []
    }
    payload = {
        "current_profile": test_profile,
        "pasted_text": "I have 5 years of experience in React."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/employees/autofill", json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print("Parsing response received successfully!")
            # Check if tech was extracted (if not Mock, it depends on AI, but 200 is good)
            print(f"Result summary: {json.dumps(result, indent=2)[:200]}...")
        else:
            print(f"Parsing failed with {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Error during parsing test: {e}")

if __name__ == "__main__":
    test_settings_persistence()
    test_parsing_flow()
