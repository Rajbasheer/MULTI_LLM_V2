from typing import Dict, Any, List, Optional
import logging
import json

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

from app.core.llm.base import LLMBase
from app.config import settings

logger = logging.getLogger(__name__)

class OpenAIHandler(LLMBase):
    """
    Handler for OpenAI's API
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o"):
        """
        Initialize the OpenAI handler
        
        Args:
            api_key: OpenAI API key
            model: Model identifier to use
        """
        super().__init__(api_key or settings.OPENAI_API_KEY)
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def generate_response(
        self, 
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a response using OpenAI
        """
        if not self.api_key:
            return {
                "text": "API key not configured for OpenAI.",
                "error": True
            }
        
        try:
            # Format messages array
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
            
            # Call OpenAI API
            response: ChatCompletion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                n=1
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            
            # Return with metadata
            return {
                "text": response_text,
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating response from OpenAI: {str(e)}")
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
            "provider": "OpenAI",
            "model": self.model,
            "capabilities": ["chat", "code", "image-understanding"] if "gpt-4" in self.model else ["chat", "code"],
            "has_api_key": bool(self.api_key)
        }
        
        return model_info