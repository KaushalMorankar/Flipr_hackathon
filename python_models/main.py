import os
import time
import uuid
import json
import logging
from datetime import datetime
import numpy as np
import redis.asyncio as redis
from typing import List, Dict
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from monitoring.data_handler import InteractionLog
from monitoring.data_handler import log_agent_interaction
from monitoring.dashboard import router as dashboard_router
from monitoring.data_handler import save_ticket as redis_save_ticket

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
pine_idx = pc.Index(name=os.getenv("PINECONE_INDEX_NAME"))

# Redis for session state
r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

# FastAPI setup
app = FastAPI()
app.include_router(dashboard_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ─── Models ────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    sessionId: str
    companyId: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    escalated: bool = False
    ticketId: str | None = None

# ─── Helpers ───────────────────────────────────────────────────────────────────
def embed_text(text: str) -> list[float]:
    """Generate embeddings using Gemini embedding model"""
    try:
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail="Embedding generation failed")

def check_index_dimension():
    stats = pine_idx.describe_index_stats()
    logger.info(f"Index dimension: {stats['dimension']}")
    assert stats["dimension"] == 768, "Pinecone index must use 768-dim (Gemini embeddings)"

def search_index(
    vec: list[float],
    companyId: str,
    top_k: int = 3
) -> list[dict]:
    """Query Pinecone with Gemini embeddings (768-dim)"""
    logger.info(f"Querying Pinecone with vector of length {len(vec)} in namespace '{companyId}'")
    try:
        resp = pine_idx.query(
            vector=vec,
            top_k=top_k,
            include_metadata=True,
            namespace=companyId
        )
        logger.info(f"Pinecone raw response: {resp}")

        if not resp.get("matches"):
            logger.warning("Pinecone returned no matches.")
            return []

        results = []
        for match in resp["matches"]:
            md = match["metadata"]
            results.append({
                "docId": match["id"],
                "title": md.get("title"),
                "content": md.get("text")
            })

        logger.info(f"🔍 Retrieved {len(results)} results for companyId '{companyId}'")
        return results

    except Exception as e:
        logger.error(f"Pinecone query error: {e}")
        raise HTTPException(status_code=500, detail=f"Pinecone query failed: {str(e)}")

async def get_history(sessionId: str) -> list[dict]:
    raw = await r.get(f"hist:{sessionId}")
    return [] if not raw else eval(raw)

async def save_history(sessionId: str, history: list[dict]) -> None:
    await r.set(f"hist:{sessionId}", repr(history), ex=3600 * 24)

def should_handoff(user_msg: str, bot_reply: str) -> bool:
    triggers = ["human", "agent", "ticket", "escalate", "help from a person"]
    combined = (user_msg + " " + bot_reply).lower()
    return any(tok in combined for tok in triggers)

# ─── Routes ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    check_index_dimension()
    logger.info("✅ Pinecone index dimension verified (768).")


# Helper function for cosine similarity
def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def generate_ticket_id():
    return f"TICKET-{uuid.uuid4().hex.upper()[:8]}"

# async def save_ticket(ticket_data):
#     try:
#         await r.set(f"ticket:{ticket_data['ticketId']}", json.dumps(ticket_data))
#         await r.publish("agent_interactions", json.dumps(ticket_data))
#     except Exception as e:
#         logger.error(f"Failed to save ticket: {e}")
#         raise HTTPException(status_code=500, detail="Ticket storage failed")

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Retrieve and update history
    original_hist = await get_history(req.sessionId)
    hist = original_hist.copy()
    hist.append({"role": "user", "text": req.message})

    # Generate embedding for current query
    emb = embed_text(req.message)

    # Query Pinecone
    print(req.companyId)
    docs = search_index(emb, req.companyId, top_k=3)
    print(docs)
    # Build context
    context_block = ""
    if not docs:
        # No KB docs found: Check recent history
        recent_user_messages = [
            msg for msg in reversed(original_hist) 
            if msg['role'] == 'user'
        ][:5]  # Get last 5 user messages
        
        relevant_context = []
        threshold = 0.7  # Adjust based on testing

        for umsg in recent_user_messages:
            # Generate embedding for historical message
            umsg_emb = embed_text(umsg['text'])
            sim = cosine_similarity(emb, umsg_emb)

            if sim > threshold:
                # Find corresponding bot response
                index = original_hist.index(umsg)
                if index + 1 < len(original_hist):
                    bot_msg = original_hist[index + 1]
                    if bot_msg['role'] == 'bot':
                        relevant_context.append(
                            f"User previously asked: {umsg['text']}\n"
                            f"Bot replied: {bot_msg['text']}"
                        )
        
        if relevant_context:
            context_block = "\n".join(relevant_context)
        else:
            context_block = (
                "No relevant information found in knowledge base or recent history."
            )
    else:
        # Build context from KB docs
        context_lines = []
        for d in docs:
            context_lines.append(
                f"— **{d['title']}** (#{d['docId']}): {d['content']}"
            )
        context_block = "\n".join(context_lines)

    # Assemble prompt
    prompt = (
        f"You are a support assistant for **{req.companyId}**.\n\n"
        "--- QUESTION ---\n"
        f"{req.message}\n\n"
        "--- KNOWLEDGE BASE ---\n"
        f"{context_block}\n\n"
        "--- CONVERSATION HISTORY ---\n" +
        "\n".join(f"{m['role']}: {m['text']}" for m in hist) +
        "\n\n"
        "--- INSTRUCTIONS ---\n"
        "1. Always prioritize the knowledge base context to answer the user's question.\n"
        "2. Only use the conversation history if the knowledge base lacks relevant information.\n"
        "3. If the knowledge base contradicts the history, prioritize the knowledge base.\n"
        "4. Keep your response concise and grounded in the knowledge base.\n"
        "4. Check the response if the message is similar and correct.If not, give the response as ***No relevant Information***.\n\n"
        "--- RESPONSE ---\n"
        "Bot:"
    )

    # Generate reply
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        reply = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

    # Update history
    hist.append({"role": "bot", "text": reply})
    await save_history(req.sessionId, hist)

    # Handoff logic
    if should_handoff(req.message, reply):
        ticket_id = generate_ticket_id()
        ticket_data = {
            "ticketId": ticket_id,
            "companyId": req.companyId,
            "sessionId": req.sessionId,
            "conversation": hist,
            "timestamp": datetime.now().isoformat(),  # ✅ Matches InteractionLog
            "status": "IN_PROGRESS",  # ✅ Matches Prisma enum
            "subject": hist[0]["text"][:100],  # ✅ Required field
            "priority": 3  # ✅ Required field
        }
        try:
            await log_agent_interaction(InteractionLog(**ticket_data))
            await redis_save_ticket(ticket_data)
        except Exception as e:
            logger.error(f"Handoff failed: {e}")
            raise HTTPException(status_code=500, detail="Handoff failed")
        
        return ChatResponse(
            reply=f"I'm escalating you to a human agent. Your ticket is #{ticket_id}.",
            escalated=True,
            ticketId=ticket_id,
            sessionId=req.sessionId
        )

    return ChatResponse(
        reply=reply,
        escalated=False,
        ticketId=None,
        sessionId=req.sessionId
    )

@app.get("/test")
async def test_embedding():
    """Test endpoint to verify embedding and retrieval"""
    test_text = "How do I reset my password?"
    vec = embed_text(test_text)
    res = search_index(vec, companyId="company1", top_k=1)
    return {"embedding_dim": len(vec), "result": res}

@app.post("/resolve-ticket")
async def resolve_ticket(
    ticketId: str = Body(...),
    companyId: str = Body(...)
):
    try:
        ticket_key = f"ticket:{ticketId}"
        ticket_json = await r.get(ticket_key)
        
        if not ticket_json:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Load existing ticket data
        ticket = json.loads(ticket_json)

        # Update ticket status and resolution time
        ticket["status"] = "RESOLVED"
        ticket["resolution_time"] = datetime.now().isoformat()

        # Save updated ticket back to Redis
        await r.set(ticket_key, json.dumps(ticket))

        return {"status": "success", "message": f"Ticket {ticketId} resolved"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve ticket: {str(e)}")
    

@app.post("/feedback")
async def submit_feedback(ticketId: str = Body(...), score: int = Body(..., ge=1, le=5)):
    ticket_key = f"ticket:{ticketId}"
    ticket_json = await r.get(ticket_key)
    if not ticket_json:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = json.loads(ticket_json)
    ticket["csat_score"] = score
    await r.set(ticket_key, json.dumps(ticket))
    return {"status": "success", "message": "Feedback recorded"}