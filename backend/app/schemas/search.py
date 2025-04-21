from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class DocumentChunk(BaseModel):
    """Schema for document chunks"""
    id: str
    text: str
    metadata: Dict[str, Any]

class SearchResult(BaseModel):
    """Schema for search results"""
    id: str
    text: str
    metadata: Dict[str, Any]
    score: float

class RetrievalResult(BaseModel):
    """Schema for retrieval results"""
    query: str
    results: List[SearchResult]
    grouped_results: Dict[str, List[SearchResult]]
    total_found: int

class SearchRequest(BaseModel):
    """Schema for search request"""
    query: str
    k: Optional[int] = 10
    filters: Optional[Dict[str, Any]] = None
    rerank: bool = True

class SearchResponse(BaseModel):
    """Schema for search response"""
    query: str
    results: List[SearchResult]
    grouped_results: Dict[str, List[SearchResult]]
    total_found: int