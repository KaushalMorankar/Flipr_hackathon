# /monitoring/feedback.py

import numpy as np
from typing import List, Dict, Any

def identify_gaps(analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Given a list of per-ticket analyses (each with "policy_violations" and "politeness_scores"),
    compute:
      - violation_counts: a dict mapping each violation to its frequency
      - low_politeness_tickets: list of indexes where avg politeness < 0.0
      - total_tickets: total number of tickets analyzed
      - politeness_means: list of average politeness per ticket
    """
    violation_counts: Dict[str, int] = {}
    politeness_means: List[float] = []
    low_politeness_tickets: List[int] = []

    for idx, analysis in enumerate(analyses):
        # Count each policy violation
        for v in analysis.get("policy_violations", []):
            violation_counts[v] = violation_counts.get(v, 0) + 1

        # Compute this ticket’s average politeness
        scores = analysis.get("politeness_scores", [])
        if scores:
            avg_score = float(np.mean(scores))
        else:
            avg_score = 0.0

        politeness_means.append(avg_score)

        # Mark ticket as “low politeness” if avg_score < 0.0
        if avg_score < 0.0:
            low_politeness_tickets.append(idx)

    total = len(analyses)
    return {
        "violation_counts":       violation_counts,
        "low_politeness_tickets": low_politeness_tickets,
        "total_tickets":          total,
        "politeness_means":       politeness_means
    }

def generate_coaching_plan(gaps: Dict[str, Any]) -> List[str]:
    """
    Turn the ‘gaps’ dictionary into a list of actionable recommendations.
    """
    recommendations: List[str] = []
    counts = gaps.get("violation_counts", {})
    total = gaps.get("total_tickets", 0)
    low_list = gaps.get("low_politeness_tickets", [])

    # 1) Missing “Let me help” (help offer)
    mh_count = counts.get("missing_help_offer", 0)
    if mh_count > 0 and total > 0:
        pct = round((mh_count / total) * 100, 1)
        recommendations.append(
            f"{mh_count}/{total} tickets ({pct}%) did not start with “Let me help.” "
            "Coaching: Always open by offering help (e.g. “Let me help you with that…”)."
        )

    # 2) Missing “Thank you” at the end
    mt_count = counts.get("missing_thank_you", 0)
    if mt_count > 0 and total > 0:
        pct2 = round((mt_count / total) * 100, 1)
        recommendations.append(
            f"{mt_count}/{total} tickets ({pct2}%) did not close with “Thank you.” "
            "Coaching: Always end on a polite note (e.g. “Thank you for contacting us—have a great day!”)."
        )

    # 3) Prohibited phrase usage (e.g. “I don't know”, “Not my problem”, “Wait a minute”)
    for phrase in ["I don't know", "Not my problem", "Wait a minute"]:
        if counts.get(phrase, 0) > 0:
            cnt = counts[phrase]
            recommendations.append(
                f"Phrase \"{phrase}\" was used in {cnt} tickets. "
                "Coaching: Avoid using that phrase—try a more supportive alternative."
            )

    # 4) Low politeness tickets (negative polarity)
    if low_list:
        recommendations.append(
            f"{len(low_list)} tickets had an average politeness score below 0.0 "
            "(negative sentiment). Coaching: Review these tickets and focus on using more polite/positive wording."
        )

    # 5) If there are no violations and no low‐politeness tickets
    if not recommendations:
        recommendations.append(
            "No major policy violations or negative‐sentiment tickets detected. Keep up the good work!"
        )

    return recommendations
