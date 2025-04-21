from typing import List, Any, Dict, Union
import logging
import os
import numpy as np

# Import sentence_transformers for embeddings
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.schemas.search import DocumentChunk

logger = logging.getLogger(__name__)

class EmbeddingsManager:
    """
    Handles embedding generation for documents and queries
    """
    
    def __init__(self):
        """Initialize the embeddings manager with the configured embedding model"""
        self.model_name = settings.EMBEDDING_MODEL
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        
        # Load model
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of text strings
        """
        if not texts:
            return []
            
        try:
            embeddings = self.model.encode(texts)
            # Convert numpy arrays to native Python lists for JSON serialization
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            # Return zero embeddings as fallback
            return [[0.0] * self.embedding_dimension] * len(texts)
    
    def get_document_embeddings(self, chunks: List[DocumentChunk]) -> List[Dict[str, Any]]:
        """
        Generate embeddings for document chunks
        """
        if not chunks:
            return []
            
        texts = [chunk.text for chunk in chunks]
        embeddings = self.get_embeddings(texts)
        
        # Combine chunks with their embeddings
        return [
            {
                "id": chunk.id,
                "text": chunk.text,
                "metadata": chunk.metadata,
                "embedding": embedding
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]
    
    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query string
        """
        if not query:
            return [0.0] * self.embedding_dimension
            
        return self.get_embeddings([query])[0]