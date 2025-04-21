from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from services.router import call_llm

router = APIRouter()

class ChatInput(BaseModel):
    message: str
    model: str = "openai-gpt4"
    stream: bool = False

@router.post("/chat")
async def chat_endpoint(payload: ChatInput):
    if payload.stream:
        generator = call_llm(payload.model, payload.message, stream=True)
        return StreamingResponse(generator, media_type="text/event-stream")
    else:
        content = await call_llm(payload.model, payload.message, stream=False)
        return JSONResponse(content={"status": "success", "response": content, "model_name": payload.model})
