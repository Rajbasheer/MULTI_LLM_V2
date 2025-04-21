from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CodeGenerationRequest(BaseModel):
    """Schema for code generation request"""
    instructions: str
    language: str = "python"
    existing_code: Optional[str] = None
    code_style: Optional[str] = None
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 2048
    use_rag: bool = True
    rag_k_results: Optional[int] = 3

class CodeGenerationResponse(BaseModel):
    """Schema for code generation response"""
    code: str
    language: str
    model: str
    processing_time: float
    context_used: bool = False
    context_items: int = 0