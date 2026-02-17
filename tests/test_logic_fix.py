
def test_formatting_logic():
    system_prompt = "Rule: {}. User Input: {partial_data}"
    partial_data = "Some input"
    
    # Simulating what's in llm_service.py now
    if "{partial_data}" in system_prompt:
        res = system_prompt.replace("{partial_data}", partial_data)
    else:
        res = f"{system_prompt}\n\nUser Input:\n{partial_data}"
    
    print(f"Result: {res}")
    assert "Rule: {}" in res
    assert "Some input" in res
    print("✅ Prompt formatting logic verified.")

def test_host_extraction():
    api_bases = [
        "http://localhost:11434/v1",
        "http://192.168.1.10:11434",
        "http://ollama-server:11434/v1/",
    ]
    for api_base in api_bases:
        host = api_base.split("/v1")[0] if "/v1" in api_base else api_base
        print(f"Base: {api_base} -> Host: {host}")
        if "/v1" in api_base:
            assert "/v1" not in host
    print("✅ Host extraction logic verified.")

if __name__ == "__main__":
    test_formatting_logic()
    test_host_extraction()
