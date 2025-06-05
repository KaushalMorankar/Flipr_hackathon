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


@router.get("/{company_id}")
async def get_agent_dashboard(company_id: str):
    """
    Fetch ticket data from Prisma (via Next.js), then compute:
      - AHT (Average Handling Time)
      - FCR (First‐Call Resolution) as a percentage (0–100)
      - CSAT average (or None if no scores)
      - QA policy violations (unique)
      - Coaching recommendations
      - A simplified ticket list for the UI
    """
    tickets = await _fetch_prisma_tickets(company_id)

    # If no tickets at all, return zeroed metrics and empty arrays
    if not tickets:
        return {
            "companyId": company_id,
            "metrics": {"aht": 0.0, "fcr": 0.0, "csat_score": None},
            "qa_summary": {"policy_violations": []},
            "feedback_recommendations": [],
            "tickets": []
        }

    total = len(tickets)
    print(total)
    # 1) First‐Call Resolution (FCR) as percentage
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

    # 3) CSAT average (None if no scores)
    csat_vals = [
        score for t in tickets
        if isinstance(score := t.get("csat_score"), (int, float))
    ]
    print(csat_vals)
    csat_score: Optional[float] = None
    if csat_vals:
        csat_score = round(sum(csat_vals) / len(csat_vals), 2)
    print(csat_score)
    # 4) QA analysis and coaching recommendations
    analyses = [
        analyze_conversation(t.get("conversation", []), t)
        for t in tickets
    ]

    # Collect unique policy violations
    all_violations = [v for analysis in analyses for v in analysis["policy_violations"]]
    unique_violations = list(set(all_violations))

    # Compute mean politeness scores per ticket
    politeness_means = [
        float(np.mean(a["politeness_scores"])) if a["politeness_scores"] else 0.0
        for a in analyses
    ]

    gaps = identify_gaps(analyses)
    gaps["politeness_scores"] = politeness_means
    recommendations = generate_coaching_plan(gaps)

    # 5) Build the ticket payload for the UI
    ticket_summaries = [
        {
            "id":           t["id"],
            "subject":      t["subject"],
            "status":       t["status"],
            "timestamp":    t["timestamp"],
            "conversation": t.get("conversation", [])
        }
        for t in tickets
    ]

    return {
        "companyId": company_id,
        "metrics": {
            "aht": aht,
            "fcr": fcr_pct,
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
