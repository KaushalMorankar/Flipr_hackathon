# /monitoring/data_handler.py
import redis.asyncio as redis
import os
import json
import logging
from datetime import datetime
from pydantic import BaseModel
from typing import Any
import httpx

# Initialize logger
logger = logging.getLogger(__name__)

class InteractionLog(BaseModel):
    """Pydantic model for ticket validation"""
    companyId: str
    sessionId: str
    ticketId: str | None
    conversation: list[dict]  # More specific type
    timestamp: str  # ISO format
    status: str = "pending"
    resolution_time: str | None = None  # Changed to str for ISO format
    csat_score: int | None = None

# Redis client
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

async def log_agent_interaction(log: InteractionLog):
    """Log agent interaction to Redis and publish for analysis"""
    key = f"ticket:{log.ticketId}"
    await r.set(key, log.json())  # Pydantic model serialization
    await r.publish("agent_interactions", log.json())

async def get_company_tickets(company_id: str) -> list[dict]:
    """Retrieve all tickets for a company with proper JSON parsing"""
    keys = await r.keys(f"ticket:*")
    tickets = []
    
    for key in keys:
        ticket_json = await r.get(key)
        if ticket_json:
            try:
                ticket_data = json.loads(ticket_json)
                if ticket_data.get("companyId") == company_id:
                    tickets.append(ticket_data)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error for {key}: {e}")
    
    return tickets

async def save_ticket(ticket_data: dict[str, Any]):
    """Save ticket to Redis and sync to Prisma"""
    try:
        # Ensure ticket_data has all required fields
        ticket_dict = ticket_data.model_dump() if hasattr(ticket_data, "model_dump") else ticket_data
        
        # Save to Redis using JSON
        await r.set(f"ticket:{ticket_dict['ticketId']}", json.dumps(ticket_dict))
        await r.publish("agent_interactions", json.dumps(ticket_dict))
        
        # Sync to Prisma
        PRISMA_SYNC_URL = os.getenv("PRISMA_SYNC_URL", "http://localhost:3000/api/customer/escalate")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                PRISMA_SYNC_URL,
                json=ticket_dict,
                timeout=10.0
            )
            response.raise_for_status()
        print("created")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error during sync: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")