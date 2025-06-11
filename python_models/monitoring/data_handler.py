# # /monitoring/data_handler.py
# import redis.asyncio as redis
# import os
# import json
# import logging
# from datetime import datetime
# from pydantic import BaseModel
# from typing import Any
# import httpx

# # Initialize logger
# logger = logging.getLogger(__name__)

# class InteractionLog(BaseModel):
#     """Pydantic model for ticket validation"""
#     companyId: str
#     sessionId: str
#     ticketId: str | None
#     conversation: list[dict]  # More specific type
#     timestamp: str  # ISO format
#     status: str = "pending"
#     resolution_time: str | None = None  # Changed to str for ISO format
#     csat_score: int | None = None

# # Redis client
# REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# async def log_agent_interaction(log: InteractionLog):
#     """Log agent interaction to Redis and publish for analysis"""
#     key = f"ticket:{log.ticketId}"
#     await r.set(key, log.json())  # Pydantic model serialization
#     await r.publish("agent_interactions", log.json())

# async def get_company_tickets(company_id: str) -> list[dict]:
#     """Retrieve all tickets for a company with proper JSON parsing"""
#     keys = await r.keys(f"ticket:*")
#     tickets = []
    
#     for key in keys:
#         ticket_json = await r.get(key)
#         if ticket_json:
#             try:
#                 ticket_data = json.loads(ticket_json)
#                 if ticket_data.get("companyId") == company_id:
#                     tickets.append(ticket_data)
#             except json.JSONDecodeError as e:
#                 logger.error(f"JSON decode error for {key}: {e}")
    
#     return tickets

# async def save_ticket(ticket_data: dict[str, Any]):
#     """Save ticket to Redis and sync to Prisma"""
#     try:
#         # Ensure ticket_data has all required fields
#         ticket_dict = ticket_data.model_dump() if hasattr(ticket_data, "model_dump") else ticket_data
        
#         # Save to Redis using JSON
#         await r.set(f"ticket:{ticket_dict['ticketId']}", json.dumps(ticket_dict))
#         await r.publish("agent_interactions", json.dumps(ticket_dict))
        
#         # Sync to Prisma
#         PRISMA_SYNC_URL = os.getenv("PRISMA_SYNC_URL", "http://localhost:3000/api/customer/escalate")
        
#         async with httpx.AsyncClient() as client:
#             response = await client.post(
#                 PRISMA_SYNC_URL,
#                 json=ticket_dict,
#                 timeout=10.0
#             )
#             response.raise_for_status()
#         print("created")
#     except httpx.HTTPError as e:
#         logger.error(f"HTTP error during sync: {e}")
#     except Exception as e:
#         logger.error(f"Unexpected error: {e}")


import os
import json
import logging
from typing import Any, Dict, List

import redis.asyncio as redis
import httpx
from pydantic import BaseModel

# ——— Setup logger ———
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ——— Pydantic model for ticket logs ———
class InteractionLog(BaseModel):
    companyId: str
    sessionId: str
    ticketId: str | None
    conversation: List[Dict[str, Any]]
    timestamp: str
    status: str = "pending"
    resolution_time: str | None = None
    csat_score: int | None = None

# ——— Redis client ———
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# ——— Next.js endpoint for syncing escalations ———
PRISMA_SYNC_URL = os.getenv(
    "PRISMA_SYNC_URL",
    "http://localhost:3000/api/customer/escalate"
)

async def log_agent_interaction(log: InteractionLog):
    """
    Log agent interaction to Redis and publish for analysis.
    """
    key = f"ticket:{log.ticketId}"
    json_str = log.json()
    await r.set(key, json_str)
    await r.publish("agent_interactions", json_str)
    logger.info(f"🔄 Logged interaction for ticket {log.ticketId}")

async def get_company_tickets(company_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve all tickets for a company from Redis.
    """
    keys = await r.keys("ticket:*")
    tickets = []

    for key in keys:
        ticket_json = await r.get(key)
        if not ticket_json:
            continue
        try:
            data = json.loads(ticket_json)
            if data.get("companyId") == company_id:
                tickets.append(data)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {key}: {e}")

    return tickets

async def save_ticket(ticket_data: Dict[str, Any]):
    """
    1) Save to Redis
    2) Build FULL payload including conversation[]
    3) POST to Next.js /escalate
    """
    try:
        # 1) Save to Redis
        key = f"ticket:{ticket_data['ticketId']}"
        payload_json = json.dumps(ticket_data)
        await r.set(key, payload_json)
        await r.publish("agent_interactions", payload_json)
        logger.info(f"✅ Saved ticket {ticket_data['ticketId']} to Redis")

        # 2) Build the FULL escalate payload
        full_payload = {
            "companyId":    ticket_data["companyId"],
            "sessionId":    ticket_data["sessionId"],
            "subject":      ticket_data.get("subject"),
            "priority":     ticket_data.get("priority", 5),
            "conversation": ticket_data["conversation"],  # full array of {role,text}
            "status":       ticket_data.get("status", "OPEN"),
        }
        logger.info(f"🔀 Syncing FULL payload to Next.js /escalate: {full_payload}")

        # 3) POST it
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                PRISMA_SYNC_URL,
                json=full_payload,
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
            resp.raise_for_status()
        logger.info("✅ Successfully synced FULL escalate payload")

    except httpx.HTTPError as e:
        logger.error(f"HTTP error during sync: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in save_ticket: {e}")
