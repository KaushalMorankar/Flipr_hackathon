# /monitoring/dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import numpy as np
from datetime import datetime
from monitoring.data_handler import get_company_tickets
from monitoring.metrics import calculate_aht, calculate_fcr, calculate_avg_csat
from monitoring.qa_engine import analyze_conversation
from monitoring.feedback import identify_gaps, generate_coaching_plan

router = APIRouter(prefix="/dashboard")

# /monitoring/dashboard.py
@router.get("/{company_id}")
async def get_agent_dashboard(company_id: str):
    tickets = await get_company_tickets(company_id)
    if not tickets:
        return {
            "metrics": {"aht": 0, "fcr": 0, "csat_score": 0},
            "qa_summary": {"policy_violations": []},
            "feedback_recommendations": [],
            "tickets": []
        }

    aht = calculate_aht(tickets)
    fcr = calculate_fcr(tickets)
    csat_score = calculate_avg_csat(tickets)

    analyses = [analyze_conversation(t["conversation"], t) for t in tickets]
    all_policy_violations = []
    for a in analyses:
        all_policy_violations.extend(a["policy_violations"])
    unique_policy_violations = list(set(all_policy_violations))

    gaps = identify_gaps(analyses)
    gaps["politeness_scores"] = [np.mean(a["politeness_scores"]) for a in analyses]
    recommendations = generate_coaching_plan(gaps)

    return {
        "metrics": {
            "aht": aht,
            "fcr": fcr,
            "csat_score": csat_score
        },
        "qa_summary": {
            "policy_violations": unique_policy_violations
        },
        "feedback_recommendations": recommendations,
        "tickets": [
            {
                "id": t["ticketId"],
                "subject": t["conversation"][0]["text"][:30] + "...",
                "status": t["status"],
                "timestamp": t.get("timestamp", datetime.now().isoformat()), 
                "conversation": t["conversation"]
            } for t in tickets
        ]
    }


@router.get("/{company_id}/metrics")
async def get_agent_metrics(company_id: str):
    tickets = await get_company_tickets(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    aht = calculate_aht(tickets)
    fcr = calculate_fcr(tickets)
    csat_score = calculate_avg_csat(tickets)

    return {
        "metrics": {
            "aht": aht,
            "fcr": fcr,
            "csat_score": csat_score
        }
    }


@router.get("/{company_id}/tickets")
async def get_agent_tickets_list(company_id: str):
    tickets = await get_company_tickets(company_id)
    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found")

    return {
        "tickets": [
            {
                "id": t["ticketId"],
                "subject": t["conversation"][0]["text"][:30] + "...",
                "status": t["status"],
                "timestamp": t["timestamp"],
                "conversation": t["conversation"]
            } for t in tickets
        ]
    }