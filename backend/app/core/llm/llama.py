from typing import Dict, Any, List, Optional
import logging
import json
import os
import aiohttp

from app.core.llm.base import LLMBase
from app.config import settings

logger = logging.getLogger(__name__)

class LlamaHandler(LLMBase):
    """
    Handler for Llama models via OpenRouter API
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "llama3-70b-8192"):
        """
        Initialize the Llama handler using OpenRouter API
        
        Args:
            api_key: OpenRouter API key
            model: Model identifier to use (defaults to llama3-70b-8192)
        """
        super().__init__(api_key or settings.OPENROUTER_API_KEY)
        self.model = model
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": settings.APP_URL,  # Required by OpenRouter
            "X-Title": settings.APP_NAME       # Optional, but helps with tracking
        }
        
        # Available Llama models on OpenRouter
        self.available_models = {
            "llama3-70b-8192": "meta-llama/llama-3-70b-instruct",
            "llama3-8b-8192": "meta-llama/llama-3-8b-instruct",
            "llama2-70b-4096": "meta-llama/llama-2-70b-chat",
            "llama2-13b-4096": "meta-llama/llama-2-13b-chat",
            "llama2-7b-4096": "meta-llama/llama-2-7b-chat"
        }
        
        # Use the full model ID for API calls
        self.model_id = self.available_models.get(self.model, self.model)
    
    async def generate_response(
        self, 
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a response using Llama via OpenRouter API
        """
        if not self.api_key:
            return {
                "text": "API key not configured for OpenRouter.",
                "error": True
            }
        
        try:
            # Prepare messages array
            messages = []
            
            # Add system prompt
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            else:
                # Default system prompt
                default_system = "You are a helpful, accurate, and friendly assistant."
                messages.append({"role": "system", "content": default_system})
            
            # Add context if provided
            if context:
                context_text = self.format_context(context)
                messages.append({"role": "system", "content": f"Use the following information to help answer the user's question:\n\n{context_text}"})
            
            # Add user message
            messages.append({"role": "user", "content": prompt})
            
            # Prepare the request payload
            payload = {
                "model": self.model_id,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 1024
            }
            
            # Call OpenRouter API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenRouter API error: {response.status} - {error_text}")
                        return {
                            "text": f"Error from OpenRouter API: {response.status}",
                            "error": True
                        }
                    
                    result = await response.json()
            
            # Extract response text
            response_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Return with metadata
            return {
                "text": response_text,
                "model": self.model_id,
                "usage": result.get("usage", {})
            }
            
        except Exception as e:
            logger.error(f"Error generating response from OpenRouter: {str(e)}")
            return {
                "text": f"Error generating response: {str(e)}",
                "error": True
            }
    
    def get_model_name(self) -> str:
        """Get the name of the current model"""
        return self.model_id
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model"""
        model_info = {
            "provider": "OpenRouter (Llama)",
            "model": self.model_id,
            "capabilities": ["chat", "code"],
            "has_api_key": bool(self.api_key)
        }
        
        return model_info
    
    def list_available_models(self) -> List[Dict[str, Any]]:
        """
        List all available Llama models on OpenRouter
        """
        models = []
        for key, model_id in self.available_models.items():
            models.append({
                "id": key,
                "name": model_id,
                "context_length": 8192 if "llama-3" in model_id else 4096,
                "description": f"Meta's {key} model via OpenRouter"
            })
        
        return models