from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal

from features import file_upload, chat_with_upload, chat_history
from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from db.models_db import init_db
from auth import auth, auth_extra 

# Initialize database (only for user + chat history)
init_db()

# App instance
app = FastAPI()

# CORS (allow all for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request Models ===
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    provider: Literal["openai", "claude", "gemini", "openrouter"]
    model_key: str
    messages: List[Message]

# === /chat endpoint ===
@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        model_id = MODELS[req.provider][req.model_key]["id"]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid provider or model")

    try:
        if req.provider == "openai":
            return StreamingResponse(stream_openai(messages, model_id), media_type="text/plain")
        elif req.provider == "claude":
            return StreamingResponse(stream_claude(messages, model_id), media_type="text/plain")
        elif req.provider == "gemini":
            return StreamingResponse(stream_gemini(messages, model_id), media_type="text/plain")
        elif req.provider == "openrouter":
            return StreamingResponse(stream_openrouter(messages, model_id), media_type="text/plain")
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === GET /models ===
@app.get("/models")
def get_models():
    return MODELS

# === Routers ===
app.include_router(file_upload.router)         # Upload + extract-only
app.include_router(chat_with_upload.router)    # Chat with uploaded file content
app.include_router(chat_history.router)        # Chat history per user
app.include_router(auth.router)                # Auth system
app.include_router(auth_extra.router)

# === Root health check ===
@app.get("/")
def health_check():
    return {"message": "LLM backend is running 🚀"}
