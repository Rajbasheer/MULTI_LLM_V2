from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    """Schema for chat request"""
    message: str
    conversation_id: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    use_rag: bool = True
    rag_k_results: Optional[int] = 5
    rag_filters: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Schema for chat response"""
    message_id: str
    conversation_id: str
    text: str
    model: str
    processing_time: float
    context_used: bool = False
    context_items: int = 0

class MessageBase(BaseModel):
    """Base schema for messages"""
    content: str
    is_user: bool
    model_name: Optional[str] = None

class MessageResponse(MessageBase):
    """Schema for message response"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    """Base schema for conversations"""
    title: str

class ConversationCreate(ConversationBase):
    """Schema for conversation creation"""
    pass

class ConversationResponse(ConversationBase):
    """Schema for conversation response"""
    id: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    messages: Optional[List[MessageResponse]] = None

    class Config:
        from_attributes = True

class ConversationList(BaseModel):
    """Schema for conversation list response"""
    conversations: List[ConversationResponse]
    total: int