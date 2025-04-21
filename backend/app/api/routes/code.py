from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
import time

from app.api.dependencies import get_db, get_llm_handler
from app.core.rag.retriever import Retriever
from app.schemas.code import CodeGenerationRequest, CodeGenerationResponse

router = APIRouter(prefix="/code", tags=["code"])
logger = logging.getLogger(__name__)

# Initialize retriever
retriever = Retriever()

@router.post("/generate", response_model=CodeGenerationResponse)
async def generate_code(
    code_request: CodeGenerationRequest,
    llm_handler = Depends(get_llm_handler),
    db: Session = Depends(get_db)
):
    """
    Generate code based on instructions
    """
    start_time = time.time()
    
    try:
        # Prepare system prompt for code generation
        system_prompt = f"""You are an expert programmer. 
Generate code in {code_request.language} based on the instructions.
Provide clean, efficient, and well-documented code.
Focus only on generating the code without any additional explanations.
"""
        
        if code_request.code_style:
            system_prompt += f"\nFollow these code style guidelines: {code_request.code_style}"
        
        # Retrieve relevant context if RAG is enabled
        context = None
        if code_request.use_rag:
            retrieval_result = await retriever.retrieve(
                query=code_request.instructions,
                k=code_request.rag_k_results or 3,
                filter_criteria={"file_type": "code"}  # Filter for code documents
            )
            context = retrieval_result.results
        
        # Generate response
        prompt = f"Create {code_request.language} code for: {code_request.instructions}"
        
        if code_request.existing_code:
            prompt += f"\n\nHere's the existing code to modify or use as reference:\n\n```{code_request.language}\n{code_request.existing_code}\n```"
        
        llm_response = await llm_handler.generate_response(
            prompt=prompt,
            context=context,
            system_prompt=system_prompt,
            temperature=code_request.temperature or 0.2,  # Lower temperature for code
            max_tokens=code_request.max_tokens or 2048
        )
        
        # Extract code from response
        code_text = llm_response["text"]
        
        # Try to clean up the code by extracting from code blocks if present
        if "```" in code_text:
            # Extract code from the first code block
            parts = code_text.split("```")
            if len(parts) >= 3:
                # Get content between first set of backticks
                code_block = parts[1]
                # Remove language identifier if present
                if code_block.startswith(code_request.language):
                    code_block = code_block[len(code_request.language):].lstrip()
                code_text = code_block.strip()
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Return response
        return CodeGenerationResponse(
            code=code_text,
            language=code_request.language,
            model=llm_handler.get_model_name(),
            processing_time=processing_time,
            context_used=bool(context),
            context_items=len(context) if context else 0
        )
    
    except Exception as e:
        logger.error(f"Error in code generation endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating code: {str(e)}")

@router.post("/explain", response_model=Dict[str, Any])
async def explain_code(
    code: str,
    language: Optional[str] = None,
    llm_handler = Depends(get_llm_handler)
):
    """
    Explain provided code
    """
    system_prompt = "You are an expert programmer. Provide a clear and concise explanation of the given code."
    
    prompt = f"Explain the following code:\n\n```{language or ''}\n{code}\n```"
    
    llm_response = await llm_handler.generate_response(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.3
    )
    
    return {
        "explanation": llm_response["text"],
        "model": llm_handler.get_model_name()
    }