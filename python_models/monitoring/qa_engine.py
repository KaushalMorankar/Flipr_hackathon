# /monitoring/qa_engine.py

from textblob import TextBlob
from typing import List, Dict
import re

# Policy settings
DEFAULT_POLICIES = {
    "prohibited_phrases": ["I don't know", "Not my problem", "Wait a minute"],
    "required_phrases": ["Thank you", "Let me help"]
}

def check_policy_violations(text: str, policies: dict = DEFAULT_POLICIES) -> List[str]:
    violations = []
    for phrase in policies["prohibited_phrases"]:
        if phrase.lower() in text.lower():
            violations.append(phrase)
    return violations

def check_politeness(text: str) -> float:
    """Returns polarity score (0=neutral, 1=formal)"""
    return TextBlob(text).sentiment.polarity

def check_resolution_effectiveness(ticket: dict) -> str:
    if ticket.get("status") == "resolved" and ticket.get("csat_score", 0) >= 4:
        return "Effective"
    elif ticket.get("status") == "resolved" and ticket.get("csat_score", 0) < 3:
        return "Needs Improvement"
    else:
        return "Pending"

def analyze_conversation(conversation: list, ticket: dict, policies: dict = DEFAULT_POLICIES) -> dict:
    agent_messages = [msg for msg in conversation if msg["role"] == "bot"]
    results = {
        "policy_violations": [],
        "politeness_scores": [],
        "resolution_status": check_resolution_effectiveness(ticket)  # Use the ticket directly
    }
    
    for msg in agent_messages:
        text = msg["text"]
        results["policy_violations"].extend(check_policy_violations(text, policies))
        results["politeness_scores"].append(check_politeness(text))
    
    return results