from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from app.api.dependencies import get_db
from app.core.rag.retriever import Retriever
from app.schemas.search import SearchRequest, SearchResponse, RetrievalResult

router = APIRouter(prefix="/search", tags=["search"])
logger = logging.getLogger(__name__)

# Initialize retriever
retriever = Retriever()

@router.post("", response_model=SearchResponse)
async def search(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for documents using the RAG retriever
    """
    try:
        # Retrieve relevant documents
        retrieval_result = await retriever.retrieve(
            query=search_request.query,
            k=search_request.k or 10,
            filter_criteria=search_request.filters,
            rerank=search_request.rerank
        )
        
        # Return search results
        return SearchResponse(
            query=search_request.query,
            results=retrieval_result.results,
            grouped_results=retrieval_result.grouped_results,
            total_found=retrieval_result.total_found
        )
    
    except Exception as e:
        logger.error(f"Error in search endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error performing search: {str(e)}")