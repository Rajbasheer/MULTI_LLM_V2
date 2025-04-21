from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ModelInfo(BaseModel):
    """Schema for model information"""
    provider: str
    model: str
    capabilities: List[str]
    has_api_key: Optional[bool] = None
    is_available: Optional[bool] = None

class ModelList(BaseModel):
    """Schema for model list response"""
    models: List[ModelInfo]

class ApiKeyRequest(BaseModel):
    """Schema for API key request"""
    provider: str
    api_key: str