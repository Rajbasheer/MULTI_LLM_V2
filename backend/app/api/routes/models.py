from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import logging

from app.api.dependencies import get_db, get_all_llm_handlers
from app.schemas.models import ModelInfo, ModelList, ApiKeyRequest

router = APIRouter(prefix="/models", tags=["models"])
logger = logging.getLogger(__name__)

@router.get("", response_model=ModelList)
async def list_models():
    """
    List all available LLM models
    """
    handlers = get_all_llm_handlers()
    
    models = []
    for key, handler in handlers.items():
        models.append(handler.get_model_info())
    
    return ModelList(models=models)

@router.post("/key")
async def set_api_key(api_key_request: ApiKeyRequest):
    """
    Set API key for a specific model provider
    """
    handlers = get_all_llm_handlers()
    
    if api_key_request.provider not in handlers:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {api_key_request.provider}")
    
    try:
        # Set API key on handler
        handlers[api_key_request.provider].set_api_key(api_key_request.api_key)
        
        # In a real app, we would store this securely in a database
        # For now, it's just in memory for the duration of the server
        
        return {"detail": f"API key for {api_key_request.provider} set successfully"}
    
    except Exception as e:
        logger.error(f"Error setting API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error setting API key: {str(e)}")