# chat_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from prisma import Prisma
from utils.pinecone_utils import search_index, validate_namespace
from utils.redis_utils import get_history, save_history
from utils.gemini_utils import embed_text, generate_response

router = APIRouter()

# Pydantic Models
class ChatRequest(BaseModel):
    sessionId: str
    companyId: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    escalated: bool = False
    ticketId: str | None = None
    sessionId: str

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
