from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

class LLMBase(ABC):
    """
    Abstract base class for LLM integrations
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize with optional API key"""
        self.api_key = api_key
    
    @abstractmethod
    async def generate_response(
        self, 
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a response from the LLM
        
        Args:
            prompt: The user prompt
            context: Optional context from RAG retrieval
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dictionary with response text and metadata
        """
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Get the name of the current model"""
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model"""
        pass
    
    def set_api_key(self, api_key: str) -> None:
        """Set the API key"""
        self.api_key = api_key
    
    def format_context(self, context: List[Dict[str, Any]]) -> str:
        """
        Format context from RAG for inclusion in prompts
        """
        if not context:
            return ""
            
        context_text = "Here is some relevant information that may help:\n\n"
        
        for i, item in enumerate(context):
            source = item.get("metadata", {}).get("file_name", "Document")
            context_text += f"[{i+1}] From {source}:\n{item['text']}\n\n"
            
        return context_text