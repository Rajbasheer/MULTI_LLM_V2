import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.models_db import SessionLocal, ChatHistory
from auth.auth import get_current_user
from db.models_db import User


router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Save chat to history
@router.post("/save-chat")
def save_chat(
    provider: str,
    model_key: str,
    file_id: int | None,
    messages: list[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        chat = ChatHistory(
            user_id=current_user.id,
            provider=provider,
            model_key=model_key,
            file_id=file_id,
            messages=json.dumps(messages)
        )
        db.add(chat)
        db.commit()
        return {"success": True, "chat_id": chat.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get chat history for current user
@router.get("/chat-history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chats = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.timestamp.desc()).all()
    return [
        {
            "id": chat.id,
            "timestamp": chat.timestamp,
            "provider": chat.provider,
            "model_key": chat.model_key,
            "file_id": chat.file_id,
            "messages": json.loads(chat.messages)
        }
        for chat in chats
    ]
