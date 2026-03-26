"""
Core Utilities
Centralized utility functions for the backend.
"""
import json
from typing import Optional, Dict, Any


def extract_json_from_response(text: str) -> Optional[Dict[str, Any]]:
    """
    Robustly extracts and parses JSON from a string.
    Handles markdown code blocks, raw JSON, and loose text.
    """
    if not text:
        return None

    text = text.strip()

    # 1. Try to find JSON within markdown code blocks
    if "```json" in text:
        try:
            content = text.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except (IndexError, json.JSONDecodeError):
            pass

    if "```" in text:
        try:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("{") or part.startswith("["):
                    return json.loads(part)
        except (IndexError, json.JSONDecodeError):
            pass

    # 2. Try to find the first '{' and last '}'
    try:
        start_idx = text.find("{")
        end_idx = text.rfind("}")

        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = text[start_idx : end_idx + 1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass

    return None
