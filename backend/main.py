from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal
from features import file_upload, chat_with_upload, chat_history

from llm_router import stream_openai, stream_claude, stream_gemini, stream_openrouter
from models import MODELS
from db.models_db import init_db,SessionLocal, BRDUpload
from sqlalchemy.orm import Session
from features import chat_with_upload
from auth import auth


init_db()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    provider: Literal["openai", "claude", "gemini", "openrouter"]
    model_key: str
    messages: List[Message]

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    
    try:
        model_id = MODELS[req.provider][req.model_key]["id"]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid provider or model")

    try:
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

@app.get("/models")
def get_models():
    return MODELS

@app.get("/file/{file_id}")
def get_file_content(file_id: int):
    db: Session = SessionLocal()
    try:
        file = db.query(BRDUpload).filter(BRDUpload.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        return {
            "id": file.id,
            "filename": file.filename,
            "content": file.full_content
        }
    finally:
        db.close()

#Router to access files uploaded    
@app.get("/files")
def list_uploaded_files():
    db = SessionLocal()
    try:
        files = db.query(BRDUpload).order_by(BRDUpload.upload_time.desc()).all()
        return [
            {
                "id": f.id,
                "filename": f.filename,
                "upload_time": f.upload_time
            }
            for f in files
        ]
    finally:
        db.close()

#file_upload
app.include_router(file_upload.router)

#chat_with_file_upload
app.include_router(chat_with_upload.router)

#Router_for_chat
app.include_router(chat_history.router)

#Router_for_user_authentication
app.include_router(auth.router)

@app.get("/")
def health_check():
    return {"message": "LLM backend is running 🚀"}
