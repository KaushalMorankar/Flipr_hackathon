# # /monitoring/dashboard.py
# from fastapi import APIRouter, Depends, HTTPException
# from typing import List
# import numpy as np
# from datetime import datetime
# from monitoring.data_handler import get_company_tickets
# from monitoring.metrics import calculate_aht, calculate_fcr, calculate_avg_csat
# from monitoring.qa_engine import analyze_conversation
# from monitoring.feedback import identify_gaps, generate_coaching_plan

# router = APIRouter(prefix="/dashboard")

# # /monitoring/dashboard.py
# @router.get("/{company_id}")
# async def get_agent_dashboard(company_id: str):
#     tickets = await get_company_tickets(company_id)
#     if not tickets:
#         return {
#             "metrics": {"aht": 0, "fcr": 0, "csat_score": 0},
#             "qa_summary": {"policy_violations": []},
#             "feedback_recommendations": [],
#             "tickets": []
#         }

#     aht = calculate_aht(tickets)
#     fcr = calculate_fcr(tickets)
#     csat_score = calculate_avg_csat(tickets)

#     analyses = [analyze_conversation(t["conversation"], t) for t in tickets]
#     all_policy_violations = []
#     for a in analyses:
#         all_policy_violations.extend(a["policy_violations"])
#     unique_policy_violations = list(set(all_policy_violations))

#     gaps = identify_gaps(analyses)
#     gaps["politeness_scores"] = [np.mean(a["politeness_scores"]) for a in analyses]
#     recommendations = generate_coaching_plan(gaps)

#     return {
#         "metrics": {
#             "aht": aht,
#             "fcr": fcr,
#             "csat_score": csat_score
#         },
#         "qa_summary": {
#             "policy_violations": unique_policy_violations
#         },
#         "feedback_recommendations": recommendations,
#         "tickets": [
#             {
#                 "id": t["ticketId"],
#                 "subject": t["conversation"][0]["text"][:30] + "...",
#                 "status": t["status"],
#                 "timestamp": t.get("timestamp", datetime.now().isoformat()), 
#                 "conversation": t["conversation"]
#             } for t in tickets
#         ]
#     }


# @router.get("/{company_id}/metrics")
# async def get_agent_metrics(company_id: str):
#     tickets = await get_company_tickets(company_id)
#     if not tickets:
#         raise HTTPException(status_code=404, detail="No tickets found")

#     aht = calculate_aht(tickets)
#     fcr = calculate_fcr(tickets)
#     csat_score = calculate_avg_csat(tickets)

#     return {
#         "metrics": {
#             "aht": aht,
#             "fcr": fcr,
#             "csat_score": csat_score
#         }
#     }


# @router.get("/{company_id}/tickets")
# async def get_agent_tickets_list(company_id: str):
#     tickets = await get_company_tickets(company_id)
#     if not tickets:
#         raise HTTPException(status_code=404, detail="No tickets found")

#     return {
#         "tickets": [
#             {
#                 "id": t["ticketId"],
#                 "subject": t["conversation"][0]["text"][:30] + "...",
#                 "status": t["status"],
#                 "timestamp": t["timestamp"],
#                 "conversation": t["conversation"]
#             } for t in tickets
#         ]
#     }

# /monitoring/dashboard.py

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import numpy as np
from datetime import datetime
import redis.asyncio as redis
import httpx
from monitoring.data_handler import get_company_tickets
from monitoring.qa_engine import analyze_conversation
from monitoring.feedback import identify_gaps, generate_coaching_plan

router = APIRouter(prefix="/dashboard")

# Redis client (for raw conversations)
r = redis.from_url("redis://localhost:6379/0", decode_responses=True)

# Next.js base URL (where your /api/dashboard-prisma lives)
NEXTJS_URL = (
    __import__("os").environ.get("NEXTJS_URL", "http://localhost:3000")
)
NEXTJS_TIMEOUT = float(__import__("os").environ.get("NEXTJS_TIMEOUT", "10.0"))


async def _fetch_prisma_tickets(company_id: str) -> List[Dict[str, Any]]:
    """Call Next.js to get all tickets + their Prisma fields."""
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
        # Timeout talking to Next.js → return empty list rather than crash
        return []
    except httpx.HTTPError:
        return []


async def _load_and_merge(company_id: str) -> List[Dict[str, Any]]:
    # 1) Raw conversations from Redis
    raw_tickets = await get_company_tickets(company_id)
    raw_by_id = {t["ticketId"]: t for t in raw_tickets}

    # 2) Prisma‐recorded tickets via Next.js
    prisma_tickets = await _fetch_prisma_tickets(company_id)

    # 3) Merge: metadata from Prisma + conversation from Redis (fallback to Prisma)
    merged: List[Dict[str, Any]] = []
    for p in prisma_tickets:
        rt = raw_by_id.get(p["id"])
        merged.append({
            "id":              p["id"],
            "subject":         p["subject"],
            "status":          p["status"],
            "timestamp":       p["timestamp"],
            "resolution_time": p.get("resolution_time"),
            "csat_score":      p.get("csat_score"),
            "fcr":             p.get("fcr", False),
            "conversation":    rt["conversation"] if rt else p.get("conversation", [])
        })
    return merged


@router.get("/{company_id}")
async def get_agent_dashboard(company_id: str):
    tickets = await _load_and_merge(company_id)
    if not tickets:
        return {
            "companyId": company_id,
            "metrics": {"aht": 0.0, "fcr": 0.0, "csat_score": 0.0},
            "qa_summary": {"policy_violations": []},
            "feedback_recommendations": [],
            "tickets": []
        }

    total = len(tickets)

    # First-Call Resolution (FCR) rate
    fcr_count = len([t for t in tickets if t.get("fcr", False)])
    fcr = round(fcr_count / total, 2)

    # Average Handling Time (AHT) in seconds
    resolved = [t for t in tickets if t["status"] == "RESOLVED"]
    aht_list: List[float] = []
    for t in resolved:
        rt = t.get("resolution_time")
        if rt:
            start = datetime.fromisoformat(t["timestamp"])
            end = datetime.fromisoformat(rt)
            aht_list.append((end - start).total_seconds())
    aht = round(sum(aht_list) / len(aht_list), 1) if aht_list else 0.0

    # CSAT average
    csat_vals = [
        score for t in tickets
        if isinstance(score := t.get("csat_score"), (int, float))
    ]
    csat_score = round(sum(csat_vals) / len(csat_vals), 2) if csat_vals else 0.0

    # QA analysis and coaching
    analyses = [analyze_conversation(t["conversation"], t) for t in tickets]

    all_violations = [v for a in analyses for v in a["policy_violations"]]
    unique_violations = list(set(all_violations))

    # Safely compute politeness means
    politeness_means = [
        float(np.mean(a["politeness_scores"])) if a["politeness_scores"] else 0.0
        for a in analyses
    ]

    gaps = identify_gaps(analyses)
    gaps["politeness_scores"] = politeness_means
    recommendations = generate_coaching_plan(gaps)

    # Build the ticket payload for the UI
    ticket_summaries = [
        {
            "id":   t["id"],
            "subject": t["subject"],
            "status":  t["status"],
            "timestamp": t["timestamp"],
            "conversation": t["conversation"]
        }
        for t in tickets
    ]

    return {
        "companyId": company_id,
        "metrics": {
            "aht": aht,
            "fcr": fcr,
            "csat_score": csat_score
        },
        "qa_summary": {
            "policy_violations": unique_violations
        },
        "feedback_recommendations": recommendations,
        "tickets": ticket_summaries
    }


@router.get("/{company_id}/metrics")
async def get_agent_metrics(company_id: str):
    tickets = await _load_and_merge(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    total = len(tickets)

    fcr = round(len([t for t in tickets if t.get("fcr", False)]) / total, 2)

    resolved = [t for t in tickets if t["status"] == "RESOLVED"]
    aht_list: List[float] = []
    for t in resolved:
        rt = t.get("resolution_time")
        if rt:
            start = datetime.fromisoformat(t["timestamp"])
            end = datetime.fromisoformat(rt)
            aht_list.append((end - start).total_seconds())
    aht = round(sum(aht_list) / len(aht_list), 1) if aht_list else 0.0

    csat_vals = [
        score for t in tickets
        if isinstance(score := t.get("csat_score"), (int, float))
    ]
    csat_score = round(sum(csat_vals) / len(csat_vals), 2) if csat_vals else 0.0

    return {
        "metrics": {
            "aht": aht,
            "fcr": fcr,
            "csat_score": csat_score
        }
    }


@router.get("/{company_id}/tickets")
async def get_agent_tickets_list(company_id: str):
    tickets = await _load_and_merge(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    return {
        "tickets": [
            {
                "id":           t["id"],
                "subject":      t["subject"],
                "status":       t["status"],
                "timestamp":    t["timestamp"],
                "conversation": t["conversation"]
            }
            for t in tickets
        ]
    }
