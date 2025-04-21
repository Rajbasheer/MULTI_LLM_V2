from typing import List, Dict, Any, Optional
import logging

from app.core.rag.vector_store import VectorStore
from app.core.rag.embeddings import EmbeddingsManager
from app.schemas.search import SearchResult, RetrievalResult

logger = logging.getLogger(__name__)

class Retriever:
    """
    Handles context retrieval for the RAG pipeline
    """
    
    def __init__(self):
        """Initialize the retriever with vector store and embeddings manager"""
        self.vector_store = VectorStore()
        self.embeddings_manager = EmbeddingsManager()
    
    async def retrieve(
        self, 
        query: str, 
        k: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None,
        rerank: bool = True
    ) -> RetrievalResult:
        """
        Retrieve relevant documents for a query
        
        Args:
            query: The query string
            k: Number of documents to retrieve
            filter_criteria: Optional metadata filters
            rerank: Whether to rerank results for better relevance
            
        Returns:
            RetrievalResult with relevant documents and metadata
        """
        # Generate query embedding
        query_embedding = self.embeddings_manager.get_query_embedding(query)
        
        # Search vector store
        results = self.vector_store.search(
            query_embedding=query_embedding,
            k=k,
            filter_criteria=filter_criteria
        )
        
        # Rerank results if enabled
        if rerank and results:
            results = self._rerank_results(query, results)
        
        # Group results by source document
        grouped_results: Dict[str, List[SearchResult]] = {}
        for result in results:
            file_path = result.metadata.get('file_path', 'unknown')
            if file_path not in grouped_results:
                grouped_results[file_path] = []
            grouped_results[file_path].append(result)
        
        # Create retrieval result
        return RetrievalResult(
            query=query,
            results=results,
            grouped_results=grouped_results,
            total_found=len(results)
        )
    
    def _rerank_results(self, query: str, results: List[SearchResult]) -> List[SearchResult]:
        """
        Rerank search results for better relevance
        
        This is a simple implementation that could be enhanced with
        a more sophisticated reranking model in production
        """
        # Extract texts and compute BM25-style scoring
        texts = [result.text for result in results]
        
        # Simple keyword matching for reranking
        query_terms = query.lower().split()
        scores = []
        
        for text in texts:
            text_lower = text.lower()
            score = 0
            
            # Score based on term frequency
            for term in query_terms:
                term_count = text_lower.count(term)
                score += min(term_count, 3)  # Cap influence of repeated terms
                
                # Bonus for exact phrase match
                if query.lower() in text_lower:
                    score += 2
            
            scores.append(score)
        
        # Combine original scores with new scores
        for i, result in enumerate(results):
            result.score = result.score * 0.7 + (scores[i] / max(max(scores), 1)) * 0.3
        
        # Sort by new scores
        return sorted(results, key=lambda x: x.score, reverse=True)