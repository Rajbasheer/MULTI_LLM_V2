from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Dict, Optional

from app.database import get_db
from app.core.llm.base import LLMBase
from app.core.llm.openai import OpenAIHandler
from app.core.llm.claude import ClaudeHandler
from app.core.llm.gemini import GeminiHandler
from app.core.llm.llama import LlamaHandler

# Cache LLM handlers
_llm_handlers = None

def get_all_llm_handlers() -> Dict[str, LLMBase]:
    """
    Get all LLM handlers
    """
    global _llm_handlers
    
    if _llm_handlers is None:
        _llm_handlers = {
            "openai": OpenAIHandler(model="gpt-4o"),
            "openai-3.5": OpenAIHandler(model="gpt-3.5-turbo"),
            "claude": ClaudeHandler(model="claude-3-opus-20240229"),
            "gemini": GeminiHandler(model="gemini-pro"),
            "llama": LlamaHandler()
        }
    
    return _llm_handlers

def get_llm_handler(
    x_model: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> LLMBase:
    """
    Get LLM handler based on header or default to OpenAI
    """
    handlers = get_all_llm_handlers()
    
    # Use specified model if provided
    if x_model and x_model in handlers:
        return handlers[x_model]
    
    # Default to OpenAI
    return handlers["openai"]