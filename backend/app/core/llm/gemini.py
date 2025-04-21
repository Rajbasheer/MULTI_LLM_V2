from typing import Dict, Any, List, Optional
import logging
import json

import google.generativeai as genai

from app.core.llm.base import LLMBase
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiHandler(LLMBase):
    """
    Handler for Google's Gemini API
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-pro"):
        """
        Initialize the Gemini handler
        
        Args:
            api_key: Google API key
            model: Model identifier to use
        """
        super().__init__(api_key or settings.GOOGLE_API_KEY)
        self.model = model
        
        # Configure API
        if self.api_key:
            genai.configure(api_key=self.api_key)
    
    async def generate_response(
        self, 
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a response using Gemini
        """
        if not self.api_key:
            return {
                "text": "API key not configured for Gemini.",
                "error": True
            }
        
        try:
            # Initialize model
            model = genai.GenerativeModel(self.model)
            
            # Prepare content
            content = prompt
            
            # Add context if provided
            if context:
                context_text = self.format_context(context)
                content = f"{context_text}\n\n{prompt}"
            
            # Add system prompt if provided
            if system_prompt:
                content = f"{system_prompt}\n\n{content}"
            
            # Call Gemini API
            response = await model.generate_content_async(
                content,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens or 1024,
                }
            )
            
            # Return with metadata
            return {
                "text": response.text,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating response from Gemini: {str(e)}")
            return {
                "text": f"Error generating response: {str(e)}",
                "error": True
            }
    
    def get_model_name(self) -> str:
        """Get the name of the current model"""
        return self.model
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model"""
        model_info = {
            "provider": "Google",
            "model": self.model,
            "capabilities": ["chat", "code", "image-understanding"] if "pro" in self.model else ["chat"],
            "has_api_key": bool(self.api_key)
        }
        
        return model_info