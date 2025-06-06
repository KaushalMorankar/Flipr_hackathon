# /monitoring/qa_engine.py

import os
from typing import List, Dict, Any
import google.generativeai as genai
from textblob import TextBlob

# ──────────────────────────────────────────────────────────────────────────────
# Make sure your environment variable is set (e.g. in .env):
#    GEMINI_API_KEY=ya29.your_actual_key_here
# Then this line actually configures the library:
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# ──────────────────────────────────────────────────────────────────────────────

# Policy settings
DEFAULT_POLICIES = {
    "prohibited_phrases": ["I don't know", "Not my problem", "Wait a minute"],
    "required_phrases": ["Thank you", "Let me help"]
}


def _textblob_sentiment(text: str) -> float:
    """
    Fallback sentiment using TextBlob polarity (ranges from -1.0 to +1.0).
    """
    return TextBlob(text).sentiment.polarity


def get_sentiment_score(text: str) -> float:
    """
    Primary path: call Gemini (gemini-1.5-flash) via genai.chat.completions.create.
    If anything goes wrong (AttributeError, key‐error, runtime error), fall back
    to TextBlob. Always return a float in [-1.0, +1.0].
    """
    try:
        # ──────────────────────────────────────────────────────────────────
        # Use the “gemini-1.5-flash” chat endpoint. This requires google-generativeai ≥ 0.21.0.
        # ──────────────────────────────────────────────────────────────────
        resp = genai.chat.completions.create(
            model="gemini-1.5-flash",
            messages=[
                {
                    "author": "system",
                    "content": (
                        "You are a sentiment analysis assistant. Given exactly one piece of text, "
                        "reply with a single number between -1.0 (very negative) and +1.0 (very positive). "
                        "Do NOT include any explanation—only output the numeric value."
                    )
                },
                {"author": "user", "content": text}
            ]
        )
        raw = resp.choices[0].message.content.strip()
        return float(raw)
    except Exception:
        # If for any reason the above fails (old/new version mismatch, network error, etc.),
        # fall back to TextBlob.
        return _textblob_sentiment(text)


def check_policy_violations(text: str, policies: dict = DEFAULT_POLICIES) -> List[str]:
    violations: List[str] = []
    for phrase in policies["prohibited_phrases"]:
        if phrase.lower() in text.lower():
            violations.append(phrase)
    return violations


def check_resolution_effectiveness(ticket: Dict[str, Any]) -> str:
    """
    Classify a ticket’s resolution into:
      - "Effective"        (status == "RESOLVED" && csat_score >= 4)
      - "Needs Improvement" (status == "RESOLVED" && csat_score < 3)
      - "Pending"          (anything else)
    """
    status = ticket.get("status")
    raw_score = ticket.get("csat_score")
    csat = raw_score if raw_score is not None else 0

    if status == "RESOLVED" and csat >= 4:
        return "Effective"
    elif status == "RESOLVED" and csat < 3:
        return "Needs Improvement"
    else:
        return "Pending"


def analyze_conversation(
    conversation: List[Dict[str, Any]],
    ticket: Dict[str, Any],
    policies: dict = DEFAULT_POLICIES
) -> Dict[str, Any]:
    """
    For each ticket:
      1) Filter all messages with role == "agent".
      2) For each agent message:
           a) Check for prohibited_phrases → add to policy_violations.
           b) Compute a sentiment‐based politeness score via Gemini (gemini-1.5-flash),
              falling back to TextBlob if Gemini call fails.
      3) If there is at least one agent message, check:
           • First agent message must contain "Let me help"
             (otherwise append "missing_help_offer" to violations).
           • Last agent message must contain "Thank you"
             (otherwise append "missing_thank_you" to violations).
      4) Return:
           {
             "policy_violations": [...],    # deduplicated list of strings
             "politeness_scores": [...],    # float per agent message
             "resolution_status": "...",    # one of "Effective" / "Needs Improvement" / "Pending"
           }
    """
    results: Dict[str, Any] = {
        "policy_violations": [],   # List[str]
        "politeness_scores": [],   # List[float]
        "resolution_status": check_resolution_effectiveness(ticket)
    }

    # 1) Gather only agent messages
    agent_messages = [msg for msg in conversation if msg.get("role") == "agent"]

    # 2) If there is at least one agent message, run first/last‐message checks
    if agent_messages:
        first_text = agent_messages[0].get("text", "")
        last_text  = agent_messages[-1].get("text", "")

        # a) First agent message must contain "Let me help"
        if not any(
            req.lower() in first_text.lower()
            for req in policies["required_phrases"]
            if "help" in req.lower()
        ):
            results["policy_violations"].append("missing_help_offer")

        # b) Last agent message must contain "Thank you"
        if not any(
            req.lower() in last_text.lower()
            for req in policies["required_phrases"]
            if "thank you" in req.lower()
        ):
            results["policy_violations"].append("missing_thank_you")

    # 3) For each agent message, check prohibited phrases + sentiment
    for msg in agent_messages:
        text = msg.get("text", "")

        # a) Prohibited‐phrase check
        results["policy_violations"].extend(check_policy_violations(text, policies))

        # b) Politeness score via Gemini (or TextBlob fallback)
        score = get_sentiment_score(text)
        results["politeness_scores"].append(score)

    # 4) Deduplicate any repeated violations
    results["policy_violations"] = list(set(results["policy_violations"]))
    return results
