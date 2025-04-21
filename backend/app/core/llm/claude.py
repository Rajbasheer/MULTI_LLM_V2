from typing import Dict, Any, List, Optional
import logging
import json

import anthropic

from app.core.llm.base import LLMBase
from app.config import settings

logger = logging.getLogger(__name__)

class ClaudeHandler(LLMBase):
    """
    Handler for Anthropic's Claude API
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-opus-20240229"):
        """
        Initialize the Claude handler
        
        Args:
            api_key: Anthropic API key
            model: Model identifier to use
        """
        super().__init__(api_key or settings.ANTHROPIC_API_KEY)
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
    
    async def generate_response(
        self, 
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a response using Claude
        """
        if not self.api_key:
            return {
                "text": "API key not configured for Claude.",
                "error": True
            }
        
        try:
            # Prepare system prompt
            system = system_prompt or "You are a helpful, accurate, and friendly assistant."
            
            # Add context if provided
            if context:
                context_text = self.format_context(context)
                system += f"\n\nUse the following information to help answer the user's question:\n\n{context_text}"
            
            # Call Claude API
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens or 1024,
                temperature=temperature,
                system=system,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Return with metadata
            return {
                "text": response.content[0].text,
                "model": self.model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating response from Claude: {str(e)}")
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
            "provider": "Anthropic",
            "model": self.model,
            "capabilities": ["chat", "code", "image-understanding"],
            "has_api_key": bool(self.api_key)
        }
        
        return model_info