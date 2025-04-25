from fastapi import FastAPI, HTTPException , Depends ,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from features import file_upload, chat_with_upload, chat_routes
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
        conversation_id = chat_data.get('conversation_id')
        if not conversation_id:
            raise HTTPException(status_code=400, detail="conversation_id is required")
            
        messages = chat_data.get('messages')
        if not messages:
            raise HTTPException(status_code=400, detail="messages is required")
            
        # Check if a conversation with this ID already exists
        existing_chat = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id,
            ChatHistory.conversation_id == conversation_id
        ).first()
        
        title = chat_data.get('title')
        if not title:
            # Extract the first few characters from user message for a default title
            try:
                messages_obj = json.loads(messages)
                model_key = list(messages_obj.keys())[0]
                model_messages = messages_obj[model_key].get('messages', [])
                first_user_message = next((msg['message'] for msg in model_messages if msg['role'] == 'user'), '')
                title = f"{first_user_message[:20]}..." if first_user_message else f"Conversation {conversation_id}"
            except:
                title = f"Conversation {conversation_id}"
        
        if existing_chat:
            # Update existing conversation
            existing_chat.messages = messages
            existing_chat.title = title
            existing_chat.updated_at = func.now()
            db.commit()
            return {"message": "Chat history updated successfully"}
        else:
            # Create new conversation
            new_chat_history = ChatHistory(
                user_id=current_user.id,
                conversation_id=conversation_id,
                messages=messages,
                title=title
            )
            db.add(new_chat_history)
            db.commit()
            db.refresh(new_chat_history)
            return {"message": "Chat history saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/get-chat-history")
def get_all_chat_history(
    model: Optional[str] = Query(None, description="Filter by model"),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Fetch user's chat histories
        query = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id
        )
        
        chat_histories = query.order_by(ChatHistory.updated_at.desc()).all()
        
        result = []
        for history in chat_histories:
            chat_data = {
                "id": history.id,
                "conversation_id": history.conversation_id,
                "messages": history.messages,
                "title": history.title,
                "created_at": history.created_at,
                "updated_at": history.updated_at
            }
            
            # If model filter is applied, only include chats with this model
            if model:
                try:
                    messages_obj = json.loads(history.messages)
                    if model in messages_obj:
                        result.append(chat_data)
                except:
                    pass  # Skip if messages can't be parsed
            else:
                result.append(chat_data)
                
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/get-chat-history/{conversation_id}")
def get_chat_history_by_id(
    conversation_id: str,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Fetch specific chat history by conversation_id
        chat_history = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id,
            ChatHistory.conversation_id == conversation_id
        ).first()
        
        if not chat_history:
            raise HTTPException(status_code=404, detail="Chat history not found")
        
        return {
            "id": chat_history.id,
            "conversation_id": chat_history.conversation_id,
            "messages": chat_history.messages,
            "title": chat_history.title,
            "created_at": chat_history.created_at,
            "updated_at": chat_history.updated_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.delete("/delete-chat-history/{conversation_id}")
def delete_chat_history(
    conversation_id: str,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Find the chat history to delete
        chat_history = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id,
            ChatHistory.conversation_id == conversation_id
        ).first()
        
        if not chat_history:
            raise HTTPException(status_code=404, detail="Chat history not found")
        
        # Delete the chat history
        db.delete(chat_history)
        db.commit()
        
        return {"message": "Chat history deleted successfully"}
    except Exception as e:
        db.rollback()
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
