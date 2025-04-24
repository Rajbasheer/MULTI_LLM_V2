from fastapi import FastAPI, HTTPException , Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal
from sqlalchemy.orm import Session
import json

from features import file_upload, chat_with_upload
from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from db.models_db import init_db, SessionLocal, ChatHistory, User
from auth import auth, auth_extra
from auth.auth import get_current_user

# Initialize database (only for user + chat history)
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
        message=messages[-10:]
        # Stream response based on provider
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
    
@app.post("/save-chat-history")
def save_chat_history(
    chat_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Prepare chat history entry
        new_chat_history = ChatHistory(
            user_id=current_user.id,
            provider=chat_data.get('provider'),     # Changed from model_provider
            model=chat_data.get('model_name'),      # Changed from model_name
            conversation_id=chat_data.get('conversation_id'),
            messages=json.dumps(chat_data.get('messages', []))
        )
        
        db.add(new_chat_history)
        db.commit()
        db.refresh(new_chat_history)
        
        return {"message": "Chat history saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-chat-history")
def get_chat_history(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Fetch user's chat histories
        chat_histories = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id
        ).order_by(ChatHistory.created_at.desc()).all()
        
        return [
            {
                "id": history.id,
                "provider": history.provider,
                "model_name": history.model,
                "conversation_id": history.conversation_id,
                "messages": json.loads(history.messages),
                "created_at": history.created_at
            } for history in chat_histories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# === GET /models ===
@app.get("/models")
def get_models():
    return MODELS

# === Routers ===
app.include_router(file_upload.router)         # Upload + extract-only
app.include_router(chat_with_upload.router)    # Chat with uploaded file content
app.include_router(auth.router)                # Auth system
app.include_router(auth_extra.router)

# === Root health check ===
@app.get("/")
def health_check():
    return {"message": "LLM backend is running 🚀"}
