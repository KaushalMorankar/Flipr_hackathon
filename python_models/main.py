import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()  # picks up GEMINI_API_KEY, etc.

API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
ENDPOINT = f"{GEMINI_API_URL}?key={API_KEY}"

app = FastAPI()

# Allow Next.js dev server to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for quick testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    companyId: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    prompt = (
        f"You are a support assistant for company {req.companyId}.\n"
        f"Answer using this context:\n"
        f"Customer question: {req.message}\n"
    )
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512
        }
    }

    try:
        resp = requests.post(ENDPOINT, json=payload)
        resp.raise_for_status()
        data = resp.json()

        candidate = data["candidates"][0]["content"]
        # If Gemini returns an object with `parts`, stitch them into a string:
        if isinstance(candidate, dict) and "parts" in candidate:
            texts = [part.get("text", "") for part in candidate["parts"]]
            reply = "".join(texts).strip()
        else:
            # Fallback if it's already a string
            reply = candidate  # type: ignore

        return ChatResponse(reply=reply)

    except requests.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
