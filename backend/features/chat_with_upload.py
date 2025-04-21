from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session

from db.models_db import SessionLocal, BRDUpload
from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from fastapi.responses import StreamingResponse

router = APIRouter()

# === Request model ===
class ChatWithUploadRequest(BaseModel):
    provider: Literal["openai", "claude", "gemini", "openrouter"]
    model_key: str
    file_id: int
    user_prompt: str

# === Route handler ===
@router.post("/chat-with-upload")
async def chat_with_uploaded_file(req: ChatWithUploadRequest):
    session: Session = SessionLocal()

    try:
        # Fetch file content
        file = session.query(BRDUpload).filter(BRDUpload.id == req.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        injected_prompt = f"""Here is a document (BRD or spec) uploaded by the user:\n\n{file.full_content}\n\nUser instruction: {req.user_prompt}"""

        messages = [
            {"role": "user", "content": injected_prompt}
        ]

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
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        session.close()
