# /monitoring/dashboard.py

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
import httpx

from monitoring.qa_engine import analyze_conversation
from monitoring.feedback import identify_gaps, generate_coaching_plan

router = APIRouter(prefix="/dashboard")

# Next.js base URL (where your /api/dashboard-prisma lives)
NEXTJS_URL = (
    __import__("os").environ.get("NEXTJS_URL", "http://localhost:3000")
)
NEXTJS_TIMEOUT = float(__import__("os").environ.get("NEXTJS_TIMEOUT", "10.0"))

async def _fetch_prisma_tickets(company_id: str) -> List[Dict[str, Any]]:
    """
    Call the Next.js Prisma endpoint to retrieve all tickets for a given company.
    This endpoint should return a JSON object with a "tickets" array, where each
    ticket has at least: id, subject, status, timestamp, resolution_time, csat_score, fcr, conversation.
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{NEXTJS_URL}/api/dashboard-prisma?path={company_id}",
                timeout=NEXTJS_TIMEOUT
            )
            res.raise_for_status()
            data = res.json()
            return data.get("tickets", [])
    except httpx.ReadTimeout:
        # Timeout talking to Next.js → return empty list
        return []
    except httpx.HTTPError:
        return []

from transformers import pipeline

# # ── Load a pretrained “1–5 star” sentiment model ────────────────────────────────
# # We do this once at import time so the model is cached and not re‐loaded on every request.
# # “nlptown/bert-base-multilingual-uncased-sentiment” outputs labels “1 star”…“5 stars”.
# sentiment_classifier = pipeline(
#     "sentiment-analysis",
#     model="nlptown/bert-base-multilingual-uncased-sentiment"
# )

# def sentiment_to_rating(text: str) -> int:
#     """
#     Run the HF sentiment classifier on `text` and convert “X star(s)” → integer X.
#     Returns an int from 1–5. If there is any error or no clear label, returns 3 (neutral).
#     """
#     try:
#         # The pipeline returns something like: [{"label": "5 stars", "score": 0.92}]
#         result = sentiment_classifier(text[:512])  # optionally truncate to first 512 chars
#         label = result[0]["label"]  # e.g. "4 stars"
#         # Extract the integer at the start of the label:
#         if label and label[0].isdigit():
#             return int(label[0])
#     except Exception:
#         # In production, you might log the exception here.
#         pass

#     # If model fails or returns something unexpected, default to neutral “3”
#     return 3

# @router.get("/{company_id}")
# async def get_agent_dashboard(company_id: str):
#     """
#     Fetch ticket data from Prisma (via Next.js), then compute:
#       - AHT (Average Handling Time)
#       - FCR (First‐Call Resolution) as a percentage (0–100)
#       - CSAT average (or None if no scores)
#       - QA policy violations (unique)
#       - Coaching recommendations
#       - A simplified ticket list for the UI
#     """
#     tickets = await _fetch_prisma_tickets(company_id)

#     # If no tickets at all, return zeroed metrics and empty arrays
#     if not tickets:
#         return {
#             "companyId": company_id,
#             "metrics": {"aht": 0.0, "fcr": 0.0, "csat_score": None},
#             "qa_summary": {"policy_violations": []},
#             "feedback_recommendations": [],
#             "tickets": []
#         }

#     total = len(tickets)
#     print(total)
#     # 1) First‐Call Resolution (FCR) as percentage
#     fcr_count = len([t for t in tickets if t.get("fcr", False)])
#     fcr_pct = round((fcr_count / total) * 100, 2) if total > 0 else 0.0

#     # 2) Average Handling Time (AHT) in seconds
#     resolved_tickets = [
#         t for t in tickets
#         if t.get("status") == "RESOLVED" and t.get("resolution_time")
#     ]
#     aht_list: List[float] = []
#     for t in resolved_tickets:
#         rt = t.get("resolution_time")
#         ts = t.get("timestamp")
#         try:
#             start = datetime.fromisoformat(ts)
#             end = datetime.fromisoformat(rt)
#             aht_list.append((end - start).total_seconds())
#         except Exception:
#             continue
#     aht = round(sum(aht_list) / len(aht_list), 1) if aht_list else 0.0

#     # 3) CSAT average (None if no scores)
#     csat_vals = [
#         score for t in tickets
#         if isinstance(score := t.get("csat_score"), (int, float))
#     ]
#     print(csat_vals)
#     csat_score: Optional[float] = None
#     if csat_vals:
#         csat_score = round(sum(csat_vals) / len(csat_vals), 2)
#     print(csat_score)
#     # 4) QA analysis and coaching recommendations
#     analyses = [
#         analyze_conversation(t.get("conversation", []), t)
#         for t in tickets
#     ]

#     # Collect unique policy violations
#     all_violations = [v for analysis in analyses for v in analysis["policy_violations"]]
#     unique_violations = list(set(all_violations))

#     # Compute mean politeness scores per ticket
#     politeness_means = [
#         float(np.mean(a["politeness_scores"])) if a["politeness_scores"] else 0.0
#         for a in analyses
#     ]

#     gaps = identify_gaps(analyses)
#     gaps["politeness_scores"] = politeness_means
#     recommendations = generate_coaching_plan(gaps)

#     # 5) Build the ticket payload for the UI
#     ticket_summaries = [
#         {
#             "id":           t["id"],
#             "subject":      t["subject"],
#             "status":       t["status"],
#             "timestamp":    t["timestamp"],
#             "conversation": t.get("conversation", [])
#         }
#         for t in tickets
#     ]

#     return {
#         "companyId": company_id,
#         "metrics": {
#             "aht": aht,
#             "fcr": fcr_pct,
#             "csat_score": csat_score
#         },
#         "qa_summary": {
#             "policy_violations": unique_violations
#         },
#         "feedback_recommendations": recommendations,
#         "tickets": ticket_summaries
#     }
from typing import List, Optional, Dict, Any
from datetime import datetime
import numpy as np
from transformers import pipeline

# ── Load a pretrained “1–5 star” sentiment model (free to use) ──────────────────
# “nlptown/bert-base-multilingual-uncased-sentiment” outputs labels “1 star”…“5 stars”.
# This model is freely downloadable from Hugging Face.
sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment"
)

def sentiment_to_rating(text: str) -> int:
    """
    Run the HF sentiment classifier on `text` and convert “X star(s)” → integer X.
    Returns an int from 1–5. If there is any error or no clear label, returns 3 (neutral).
    """
    try:
        # Truncate to first 512 chars (BERT’s usual max token length)
        snippet = text[:512]
        result = sentiment_classifier(snippet)
        # result is like: [{"label": "5 stars", "score": 0.92}]
        label = result[0].get("label", "")
        if label and label[0].isdigit():
            return int(label[0])
    except Exception:
        # In production you might log the exception; here, default to neutral “3”
        pass

    return 3  # fallback neutral


@router.get("/{company_id}")
async def get_agent_dashboard(company_id: str) -> Dict[str, Any]:
    """
    Fetch ticket data from Prisma (via Next.js), then compute:
      - AHT (Average Handling Time)
      - FCR (First-Call Resolution) as a percentage (0–100)
      - CSAT average (or None if no scores)
         • If a ticket has an explicit csat_score, use that.
         • If csat_score is missing but feedback text is present, infer a 1–5 rating via sentiment_to_rating.
      - QA policy violations (unique)
      - Coaching recommendations
      - A simplified ticket list for the UI (including each ticket’s “sentiment_rating” if we inferred one)
    """
    tickets = await _fetch_prisma_tickets(company_id)

    # 0) If no tickets at all, return zeroed metrics and empty arrays
    if not tickets:
        return {
            "companyId": company_id,
            "metrics": {
                "aht":                0.0,
                "fcr":                0.0,
                "csat_score":         None,
            },
            "qa_summary": {"policy_violations": []},
            "feedback_recommendations": [],
            "tickets": [],
        }

    total = len(tickets)
    print(f"Total tickets fetched: {total}")

    # 1) First-Call Resolution (FCR) as a percentage
    fcr_count = len([t for t in tickets if t.get("fcr", False)])
    fcr_pct = round((fcr_count / total) * 100, 2) if total > 0 else 0.0

    # 2) Average Handling Time (AHT) in seconds
    resolved_tickets = [
        t for t in tickets
        if t.get("status") == "RESOLVED" and t.get("resolution_time")
    ]
    aht_list: List[float] = []
    for t in resolved_tickets:
        rt = t.get("resolution_time")
        ts = t.get("timestamp")
        try:
            start = datetime.fromisoformat(ts)
            end = datetime.fromisoformat(rt)
            aht_list.append((end - start).total_seconds())
        except Exception:
            continue
    aht = round(sum(aht_list) / len(aht_list), 1) if aht_list else 0.0

    # 3) Build a combined list of explicit csat_scores + inferred sentiment ratings
    csat_vals: List[int] = []
    per_ticket_sentiment: Dict[str, int] = {}

    for t in tickets:
        explicit = t.get("csat_score")
        feedback_text = t.get("feedback")

        if isinstance(explicit, (int, float)):
            # Use the explicit user-provided score (assume 1–5)
            csat_vals.append(int(explicit))
            per_ticket_sentiment[t["id"]] = int(explicit)
        else:
            # No explicit csat_score → if feedback text exists, infer a rating
            if isinstance(feedback_text, str) and feedback_text.strip():
                inferred = sentiment_to_rating(feedback_text)
                csat_vals.append(inferred)
                per_ticket_sentiment[t["id"]] = inferred
            # else: neither explicit nor textual feedback → skip

    print("All CSAT values (explicit + inferred):", csat_vals)
    csat_score: Optional[float] = None
    if csat_vals:
        csat_score = round(sum(csat_vals) / len(csat_vals), 2)
    print("Computed average CSAT:", csat_score)

    # 4) QA analysis and coaching recommendations
    analyses = [
        analyze_conversation(t.get("conversation", []), t)
        for t in tickets
    ]

    # Collect unique policy violations
    all_violations = [
        v
        for analysis in analyses
        for v in analysis["policy_violations"]
    ]
    unique_violations = list(set(all_violations))

    # Compute mean politeness scores per ticket (agent-side politeness)
    politeness_means = [
        float(np.mean(a["politeness_scores"])) if a["politeness_scores"] else 0.0
        for a in analyses
    ]

    gaps = identify_gaps(analyses)
    gaps["politeness_scores"] = politeness_means
    recommendations = generate_coaching_plan(gaps)

    # 5) Build the ticket payload for the UI, including sentiment_rating if we inferred it
    ticket_summaries: List[Dict[str, Any]] = []
    for t in tickets:
        summary: Dict[str, Any] = {
            "id":           t["id"],
            "subject":      t["subject"],
            "status":       t["status"],
            "timestamp":    t["timestamp"],
            "conversation": t.get("conversation", []),
            # Attach sentiment_rating (explicit or inferred), or None if neither
            "sentiment_rating": per_ticket_sentiment.get(t["id"], None),
        }
        ticket_summaries.append(summary)

    return {
        "companyId": company_id,
        "metrics": {
            "aht":           aht,
            "fcr":           fcr_pct,
            "csat_score":    csat_score,
        },
        "qa_summary": {
            "policy_violations": unique_violations
        },
        "feedback_recommendations": recommendations,
        "tickets": ticket_summaries,
    }


@router.get("/{company_id}/metrics")
async def get_agent_metrics(company_id: str):
    """
    Return only the metrics (AHT, FCR%, CSAT) for a given company.
    """
    tickets = await _fetch_prisma_tickets(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    total = len(tickets)
    print(total)
    # First‐Call Resolution (FCR) %
    fcr_count = len([t for t in tickets if t.get("fcr", False)])
    fcr_pct = round((fcr_count / total) * 100, 2) if total > 0 else 0.0

    # Average Handling Time (AHT)
    resolved_tickets = [
        t for t in tickets
        if t.get("status") == "RESOLVED" and t.get("resolution_time")
    ]
    aht_list: List[float] = []
    for t in resolved_tickets:
        rt = t.get("resolution_time")
        ts = t.get("timestamp")
        try:
            start = datetime.fromisoformat(ts)
            end = datetime.fromisoformat(rt)
            aht_list.append((end - start).total_seconds())
        except Exception:
            continue
    aht = round(sum(aht_list) / len(aht_list), 1) if aht_list else 0.0

    # CSAT average (None if no scores)
    csat_vals = [
        score for t in tickets
        if isinstance(score := t.get("csat_score"), (int, float))
    ]
    csat_score: Optional[float] = None
    if csat_vals:
        csat_score = round(sum(csat_vals) / len(csat_vals), 2)

    return {
        "metrics": {
            "aht": aht,
            "fcr": fcr_pct,
            "csat_score": csat_score
        }
    }


@router.get("/{company_id}/tickets")
async def get_agent_tickets_list(company_id: str):
    """
    Return a simplified list of tickets (id, subject, status, timestamp, conversation).
    """
    tickets = await _fetch_prisma_tickets(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    return {
        "tickets": [
            {
                "id":           t["id"],
                "subject":      t["subject"],
                "status":       t["status"],
                "timestamp":    t["timestamp"],
                "conversation": t.get("conversation", [])
            }
            for t in tickets
        ]
    }
