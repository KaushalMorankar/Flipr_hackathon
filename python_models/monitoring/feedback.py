# /monitoring/feedback.py
import numpy as np

def identify_gaps(ticket_analysis: list) -> dict:
    gaps = {"policy_violations": []}
    for analysis in ticket_analysis:
        gaps["policy_violations"].extend(analysis["policy_violations"])
    gaps["policy_violations"] = list(set(gaps["policy_violations"]))
    return gaps

def generate_coaching_plan(gaps: dict) -> list:
    recommendations = []
    if "I don't know" in gaps.get("policy_violations", []):
        recommendations.append("Complete Module: Effective Troubleshooting")
    if "politeness_score" in gaps and np.mean(gaps.get("politeness_scores", [1.0])) < 0.3:
        recommendations.append("Complete Module: Customer Communication")
    return recommendations