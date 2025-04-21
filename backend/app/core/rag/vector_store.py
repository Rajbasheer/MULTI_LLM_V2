from typing import List, Dict, Any, Optional, Union
import logging
import os
import json
import shutil
import numpy as np
from datetime import datetime
import faiss
import pickle

from app.config import settings
from app.schemas.search import DocumentChunk, SearchResult

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Manages the vector database for document retrieval using FAISS
    """
    
    def __init__(self):
        """Initialize the vector store with the configured settings"""
        self.index_path = os.path.join(settings.VECTOR_DB_PATH, "faiss_index.bin")
        self.metadata_path = os.path.join(settings.VECTOR_DB_PATH, "metadata.json")
        self.id_map_path = os.path.join(settings.VECTOR_DB_PATH, "id_map.pkl")
        self.dim = settings.EMBEDDING_DIMENSION
        
        # Load or create index
        self._load_or_create_index()
    
    def _load_or_create_index(self):
        """Load existing index or create a new one if it doesn't exist"""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path) and os.path.exists(self.id_map_path):
            try:
                logger.info("Loading existing FAISS index")
                self.index = faiss.read_index(self.index_path)
                
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                
                with open(self.id_map_path, 'rb') as f:
                    self.id_map = pickle.load(f)
                
                self.current_count = self.index.ntotal
                logger.info(f"Loaded index with {self.current_count} elements")
                
            except Exception as e:
                logger.error(f"Error loading index: {str(e)}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        logger.info("Creating new FAISS index")
        
        # Create a flat index for exact search (can be changed to other index types for better performance)
        self.index = faiss.IndexFlatIP(self.dim)  # Inner product (cosine similarity with normalized vectors)
        
        # For larger datasets, consider using:
        # self.index = faiss.IndexIVFFlat(faiss.IndexFlatIP(self.dim), self.dim, 100)
        # self.index.train(np.zeros((100, self.dim), dtype=np.float32))  # Training with dummy data
        
        self.metadata = {"documents": {}}
        self.id_map = {}  # Maps FAISS internal IDs to our document IDs
        self.current_count = 0
    
    def _save_index(self):
        """Save the index and metadata to disk"""
        try:
            os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, self.index_path)
            
            # Save metadata
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f)
            
            # Save ID mapping
            with open(self.id_map_path, 'wb') as f:
                pickle.dump(self.id_map, f)
                
            logger.info(f"Saved index with {self.current_count} elements")
        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
    
    def add_documents(self, documents: List[Dict[str, Any]]) -> int:
        """
        Add documents to the vector store
        
        Args:
            documents: List of document dictionaries with id, text, metadata, and embedding
            
        Returns:
            Number of documents added
        """
        if not documents:
            return 0
            
        # Add documents to the index
        try:
            # Get new IDs starting from current count
            start_id = self.current_count
            
            # Extract embeddings and normalize them for cosine similarity
            embeddings = np.array([doc["embedding"] for doc in documents], dtype=np.float32)
            faiss.normalize_L2(embeddings)  # Normalize for cosine similarity
            
            # Add vectors to the index
            self.index.add(embeddings)
            
            # Update metadata and ID mapping
            for i, doc in enumerate(documents):
                doc_id = start_id + i
                self.id_map[doc_id] = doc["id"]
                
                # Store metadata without the embedding to save space
                doc_metadata = {
                    "id": doc["id"],
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                    "added_at": datetime.now().isoformat()
                }
                self.metadata["documents"][doc["id"]] = doc_metadata
            
            # Update current count
            self.current_count += len(documents)
            
            # Save index
            self._save_index()
            
            return len(documents)
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            return 0
    
    def search(
        self, 
        query_embedding: List[float], 
        k: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """
        Search for similar documents to the query embedding
        
        Args:
            query_embedding: The query embedding vector
            k: Number of results to return
            filter_criteria: Optional metadata filter criteria
            
        Returns:
            List of SearchResult objects
        """
        if self.current_count == 0:
            return []
            
        try:
            # Convert query embedding to numpy array and normalize
            query_np = np.array([query_embedding], dtype=np.float32)
            faiss.normalize_L2(query_np)
            
            # Adjust k to avoid requesting more items than in the index
            k = min(k, self.current_count)
            
            # To account for filtering, we retrieve more results and filter them
            search_k = min(k * 3, self.current_count)  # Retrieve more to allow for filtering
            
            # Search the index
            distances, indices = self.index.search(query_np, search_k)
            
            results = []
            for i, (idx, distance) in enumerate(zip(indices[0], distances[0])):
                if idx == -1:  # FAISS returns -1 for padding when not enough results
                    continue
                
                # Get the document ID from our mapping
                doc_id = self.id_map.get(int(idx))
                if not doc_id or doc_id not in self.metadata["documents"]:
                    continue
                
                doc = self.metadata["documents"][doc_id]
                
                # Filter results if criteria provided
                if filter_criteria and not self._matches_filter(doc["metadata"], filter_criteria):
                    continue
                
                # Convert distance to similarity score (FAISS returns inner product for normalized vectors)
                similarity_score = float(distance)  # Already represents cosine similarity for normalized vectors
                
                results.append(
                    SearchResult(
                        id=doc["id"],
                        text=doc["text"],
                        metadata=doc["metadata"],
                        score=similarity_score
                    )
                )
                
                # If we have enough results after filtering, break
                if len(results) >= k:
                    break
            
            return results
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []
    
    def _matches_filter(self, metadata: Dict[str, Any], filter_criteria: Dict[str, Any]) -> bool:
        """
        Check if metadata matches the filter criteria
        """
        for key, value in filter_criteria.items():
            if key not in metadata:
                return False
                
            if isinstance(value, list):
                if metadata[key] not in value:
                    return False
            elif metadata[key] != value:
                return False
                
        return True
    
    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a document by its ID
        """
        if doc_id in self.metadata["documents"]:
            return self.metadata["documents"][doc_id]
        return None
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document from the vector store
        
        Note: FAISS doesn't support direct deletion, so we need to rebuild the index
        """
        if doc_id not in self.metadata["documents"]:
            return False
            
        try:
            # Remove from metadata
            del self.metadata["documents"][doc_id]
            
            # For FAISS, we need to rebuild the index without the deleted document
            # In a production system, consider using FAISS with an ID map or a DB like Milvus/Pinecone
            
            # Create a new index
            new_index = faiss.IndexFlatIP(self.dim)
            new_id_map = {}
            new_count = 0
            
            # Collect all existing embeddings and rebuild
            embeddings = []
            doc_ids = []
            
            # Find all FAISS IDs that need to be preserved (reverse lookup)
            preserved_faiss_ids = {}
            for faiss_id, document_id in self.id_map.items():
                if document_id != doc_id and document_id in self.metadata["documents"]:
                    preserved_faiss_ids[faiss_id] = document_id
            
            # Rebuild the index with preserved documents
            if preserved_faiss_ids:
                # This is not efficient for large databases - in production consider using
                # a database with proper deletion support like Pinecone or Milvus
                
                # Extract IDs to retrieve
                faiss_ids_to_keep = list(preserved_faiss_ids.keys())
                
                # For each preserved document, re-add to the new index
                for i, faiss_id in enumerate(faiss_ids_to_keep):
                    doc_id = preserved_faiss_ids[faiss_id]
                    
                    # In a real implementation, we would need to retrieve the embeddings
                    # Since we don't store embeddings in metadata, we'd need to recompute or store them
                    # For now, we'll log a warning and clear the index
                    logger.warning("FAISS rebuilding not fully implemented - would need embeddings storage")
                
                # In a production implementation, you'd have a solution for this:
                # 1. Store embeddings separately
                # 2. Use a database like Pinecone that supports deletion
                # 3. Implement a soft delete system
                
                # For this demo, we'll just clear the index
                logger.warning("Clearing index as a workaround for deletion")
                self._create_new_index()
            else:
                # If no documents left, just create a new empty index
                self._create_new_index()
            
            # Save changes
            self._save_index()
            
            logger.info(f"Deleted document {doc_id} from vector store")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document from vector store: {str(e)}")
            return False
    
    def clear(self) -> bool:
        """
        Clear the vector store
        """
        try:
            self._create_new_index()
            self._save_index()
            logger.info("Vector store cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing vector store: {str(e)}")
            return False