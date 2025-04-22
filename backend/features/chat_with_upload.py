from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import Literal

from auth.auth import get_current_user
from db.models_db import User
from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from fastapi.responses import StreamingResponse

router = APIRouter()

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
