# agent_routes.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from prisma import Prisma
from typing import Optional

router = APIRouter(prefix="/agent", tags=["Agent"])

# Pydantic Models
class AgentResponse(BaseModel):
    ticketId: str
    message: str
    agentId: str

class AgentTicketResponse(BaseModel):
    status: str
    ticketId: Optional[str] = None

# Agent Endpoints
@router.post("/respond", response_model=AgentTicketResponse)
async def agent_respond(req: AgentResponse):
    try:
        # Update ticket + add agent message
        await Prisma.ticket.update(
            where={"id": req.ticketId},
            data={
                "status": "IN_PROGRESS",
                "agentId": req.agentId,
                "messages": {
                    "create": {
                        "content": req.message,
                        "role": "agent"
                    }
                }
            }
        )
        return {"status": "success", "ticketId": req.ticketId}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send response")

@router.post("/resolve/{ticket_id}", response_model=AgentTicketResponse)
async def resolve_ticket(ticket_id: str):
    try:
        await Prisma.ticket.update(
            where={"id": ticket_id},
            data={"status": "RESOLVED"}
        )
        return {"status": "resolved", "ticketId": ticket_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to resolve ticket")