import os
import logging
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import redis.asyncio as redis
from pinecone import Pinecone, ServerlessSpec

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

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    hist = await get_history(req.sessionId)
    hist.append({"role": "user", "text": req.message})

    emb = embed_text(req.message)

    # Query Pinecone
    docs = search_index(emb, req.companyId, top_k=3)

    # Build context
    context_lines = []
    for d in docs:
        context_lines.append(f"— **{d['title']}** (#{d['docId']}): {d['content']}")
    context_block = "\n".join(context_lines) or "No relevant articles found."

    # Assemble prompt
    prompt = (
        f"You are a support assistant for **{req.companyId}**.\n\n"
        "Use the following knowledge base articles:\n"
        f"{context_block}\n\n"
        "Conversation so far:\n" +
        "\n".join(f"{m['role']}: {m['text']}" for m in hist) +
        "\n\nBot:"
    )
    print(pine_idx.describe_index_stats()["namespaces"])

    # Use Gemini to generate reply
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        reply = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

    hist.append({"role": "bot", "text": reply})
    await save_history(req.sessionId, hist)


    if should_handoff(req.message, reply):
        ticket_id = "TICKET-12345"
        return ChatResponse(
            reply=f"I'm escalating you to a human agent. Your ticket is #{ticket_id}.",
            escalated=True,
            ticketId=ticket_id,
            sessionId=req.sessionId      # <— echo it back
        )

    return ChatResponse(
        reply=reply,
        escalated=False,
        ticketId=None,
        sessionId=req.sessionId          # <— echo it back
    )

@app.get("/test")
async def test_embedding():
    """Test endpoint to verify embedding and retrieval"""
    test_text = "How do I reset my password?"
    vec = embed_text(test_text)
    res = search_index(vec, companyId="company1", top_k=1)
    return {"embedding_dim": len(vec), "result": res}