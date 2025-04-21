from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
import time

from app.api.dependencies import get_db, get_llm_handler
from app.core.rag.retriever import Retriever
from app.models.chat import Conversation, Message
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    ConversationCreate, 
    ConversationResponse,
    MessageResponse,
    ConversationList
)

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

# Initialize retriever
retriever = Retriever()

@router.post("", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    llm_handler = Depends(get_llm_handler),
    db: Session = Depends(get_db)
):
    """
    Send a message to the selected model with RAG
    """
    start_time = time.time()
    
    # Get conversation
    conversation = None
    if chat_request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == chat_request.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create new conversation if needed
    if not conversation:
        conversation = Conversation(title=chat_request.message[:50])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        content=chat_request.message,
        is_user=True
    )
    db.add(user_message)
    db.commit()
    
    try:
        # Retrieve relevant context if RAG is enabled
        context = None
        if chat_request.use_rag:
            retrieval_result = await retriever.retrieve(
                query=chat_request.message,
                k=chat_request.rag_k_results or 5,
                filter_criteria=chat_request.rag_filters
            )
            context = retrieval_result.results
        
        # Generate response
        llm_response = await llm_handler.generate_response(
            prompt=chat_request.message,
            context=context,
            system_prompt=chat_request.system_prompt,
            temperature=chat_request.temperature or 0.7,
            max_tokens=chat_request.max_tokens
        )
        
        # Save AI message
        ai_message = Message(
            conversation_id=conversation.id,
            content=llm_response["text"],
            is_user=False,
            model_name=llm_handler.get_model_name()
        )
        db.add(ai_message)
        db.commit()
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Return response
        return ChatResponse(
            message_id=ai_message.id,
            conversation_id=conversation.id,
            text=llm_response["text"],
            model=llm_handler.get_model_name(),
            processing_time=processing_time,
            context_used=bool(context),
            context_items=len(context) if context else 0
        )
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List all conversations
    """
    conversations = db.query(Conversation).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    
    return ConversationList(
        conversations=[
            ConversationResponse(
                id=conversation.id,
                title=conversation.title,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
                message_count=db.query(Message).filter(Message.conversation_id == conversation.id).count()
            )
            for conversation in conversations
        ],
        total=db.query(Conversation).count()
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get conversation details
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
    
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages),
        messages=[
            MessageResponse(
                id=message.id,
                content=message.content,
                is_user=message.is_user,
                model_name=message.model_name,
                created_at=message.created_at
            )
            for message in messages
        ]
    )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a conversation
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete messages
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    
    # Delete conversation
    db.delete(conversation)
    db.commit()
    
    return {"detail": "Conversation deleted successfully"}