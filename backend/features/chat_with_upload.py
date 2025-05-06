from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Body
from sqlalchemy.orm import Session
from typing import Literal, List, Optional
from pydantic import BaseModel

from auth.auth import get_current_user
from db.models_db import User, SessionLocal
from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from fastapi.responses import StreamingResponse

router = APIRouter()

# Define a model for the JSON-based chat with uploaded file endpoint
class ChatWithFileRequest(BaseModel):
    provider: Literal["openai", "claude", "gemini", "openrouter"]
    model_key: str
    file_id: int
    user_prompt: str
    conversation_history: Optional[List[dict]] = []

# Keep the existing form-based file upload endpoint
@router.post("/chat-with-upload")
async def chat_with_file_upload(
    file: UploadFile = File(...),
    provider: Literal["openai", "claude", "gemini", "openrouter"] = Form(...),
    model_key: str = Form(...),
    user_prompt: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Read and decode file content
        file_content = await file.read()
        decoded_text = file_content.decode("utf-8", errors="ignore")

        # Inject into prompt
        injected_prompt = f"""Here is a document (BRD or spec) uploaded by the user:\n\n{decoded_text}\n\nUser instruction: {user_prompt}"""

        messages = [{"role": "user", "content": injected_prompt}]

        # Get model ID
        try:
            model_id = MODELS[provider][model_key]["id"]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid provider or model key")

        # Call appropriate LLM stream
        if provider == "openai":
            return StreamingResponse(stream_openai(messages, model_id), media_type="text/plain")
        elif provider == "claude":
            return StreamingResponse(stream_claude(messages, model_id), media_type="text/plain")
        elif provider == "gemini":
            return StreamingResponse(stream_gemini(messages, model_id), media_type="text/plain")
        elif provider == "openrouter":
            return StreamingResponse(stream_openrouter(messages, model_id), media_type="text/plain")
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

# Add a new JSON-based endpoint for chat with previously uploaded file
@router.post("/chat-with-file")
async def chat_with_file(
    req: ChatWithFileRequest, 
    current_user: User = Depends(get_current_user)
):
    try:
        # Get file content from storage using file_id
        # You'll need to implement this based on your storage system
        file_content = get_file_content_by_id(req.file_id)
        
        # Build the messages array with conversation history
        messages = []
        
        # First add the conversation history if provided
        if req.conversation_history and len(req.conversation_history) > 0:
            messages.extend(req.conversation_history)
        
        # Then add a system message with the file content as context
        messages.append({
            "role": "system",
            "content": f"Reference this uploaded document when answering the user:\n\n{file_content}"
        })
        
        # Finally add the current user prompt
        messages.append({
            "role": "user",
            "content": req.user_prompt
        })
        
        # Ensure we don't exceed token limits
        # This is a simple approach - you might want to implement more sophisticated truncation
        max_messages = 20
        if len(messages) > max_messages:
            # Keep system messages and the most recent user messages
            system_messages = [msg for msg in messages if msg["role"] == "system"]
            other_messages = [msg for msg in messages if msg["role"] != "system"]
            other_messages = other_messages[-(max_messages - len(system_messages)):]
            messages = system_messages + other_messages
        
        # Get model ID
        try:
            model_id = MODELS[req.provider][req.model_key]["id"]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid provider or model key")
            
        # Call appropriate LLM stream
        if req.provider == "openai":
            return StreamingResponse(stream_openai(messages, model_id), media_type="text/plain")
        elif req.provider == "claude":
            return StreamingResponse(stream_claude(messages, model_id), media_type="text/plain")
        elif req.provider == "gemini":
            return StreamingResponse(stream_gemini(messages, model_id), media_type="text/plain")
        elif req.provider == "openrouter":
            return StreamingResponse(stream_openrouter(messages, model_id), media_type="text/plain")
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")

# Helper function to get file content by ID
def get_file_content_by_id(file_id: int) -> str:
    try:
        # Replace this with your actual file retrieval logic
        # This is just a placeholder implementation
        db = SessionLocal()
        try:
            # Assuming you have a model like UploadedFile
            from features.file_upload import UploadedFile
            file_record = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
            if not file_record:
                raise HTTPException(status_code=404, detail="File not found")
                
            # Read the file content - adjust based on how you store files
            file_path = file_record.file_path
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            return content
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")