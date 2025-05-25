# prisma_sync.py
import httpx
import os
import logging
import tenacity  # For retries
from datetime import datetime

logger = logging.getLogger(__name__)

PRISMA_API_URL = os.getenv("PRISMA_API_URL", "http://localhost:3000/api/tickets")
PRISMA_SYNC_ENABLED = os.getenv("PRISMA_SYNC_ENABLED", "true").lower() == "true"

@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(multiplier=1),
    retry=tenacity.retry_if_exception_type((httpx.NetworkError, httpx.TimeoutException))
)
async def sync_to_prisma(ticket_data):
    """Sync Redis ticket to Prisma database"""
    if not PRISMA_SYNC_ENABLED:
        logger.info("Prisma sync disabled")
        return
    
    try:
        # Map Redis ticket to Prisma format
        prisma_payload = {
            "message": ticket_data["conversation"][0]["text"],  # First user message
            "subdomain": ticket_data["companyId"]  # Map companyId to subdomain
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                PRISMA_API_URL,
                json=prisma_payload,
                timeout=10.0
            )
            
            if response.status_code != 201:
                logger.error(f"Prisma sync failed: {response.text}")
                return False
                
            logger.info(f"Successfully synced ticket {ticket_data['ticketId']} to Prisma")
            return True
            
    except Exception as e:
        logger.error(f"Prisma sync error: {e}", exc_info=True)
        return False