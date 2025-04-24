# backend/features/chat_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth.auth import get_current_user
from db.models_db import ChatHistory, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.delete("/delete-chat/{conversation_id}")
def delete_chat(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(ChatHistory).filter(
        ChatHistory.conversation_id == conversation_id,
        ChatHistory.user_id == current_user.id
    ).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")

    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted successfully"}
