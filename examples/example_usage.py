#!/usr/bin/env python3
"""
Example script demonstrating how to use the Claude configuration
"""

import json
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).parent.parent


def load_config():
    """Load the main Claude configuration"""
    config_path = BASE_DIR / ".claude" / "config.json"
    with open(config_path, "r") as f:
        return json.load(f)


def load_prompt(prompt_name):
    """Load a system prompt by name"""
    prompt_path = BASE_DIR / ".claude" / "prompts" / f"{prompt_name}.md"
    with open(prompt_path, "r") as f:
        return f.read()


def load_api_settings():
    """Load API settings"""
    settings_path = BASE_DIR / ".claude" / "settings" / "api_settings.json"
    with open(settings_path, "r") as f:
        return json.load(f)


def main():
    # Load configuration
    config = load_config()
    print(f"Model: {config['model']}")
    print(f"Max Tokens: {config['max_tokens']}")
    print(f"Temperature: {config['temperature']}")

    # Load a prompt
    coding_prompt = load_prompt("coding_assistant")
    print(f"\nLoaded prompt (first 100 chars):\n{coding_prompt[:100]}...")

    # Load API settings
    api_settings = load_api_settings()
    print(f"\nAPI Base URL: {api_settings['base_url']}")
    print(f"Timeout: {api_settings['timeout']}s")

    # Example: Making a request (pseudo-code)
    # This would require the anthropic library: pip install anthropic
    """
    import anthropic
    
    client = anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
    
    message = client.messages.create(
        model=config['model'],
        max_tokens=config['max_tokens'],
        temperature=config['temperature'],
        system=coding_prompt,
        messages=[
            {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
        ]
    )
    
    print(message.content)
    """


if __name__ == "__main__":
    main()
