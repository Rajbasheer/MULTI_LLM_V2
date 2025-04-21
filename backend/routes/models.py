from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

class ModelSelection(BaseModel):
    model_key: str

# Mocked models
available_models = {
    "openai-gpt4": { "id": "gpt-4", "name": "GPT-4 (OpenAI)" },
    "claude-3.5": { "id": "claude-3", "name": "Claude 3" },
    "gemini-2.5": { "id": "gemini-pro", "name": "Gemini Pro" },
    "grok-v1": { "id": "grok-v1", "name": "Grok V1" }
}

@router.get("/get_models")
def get_models():
    return available_models

@router.post("/set_model")
def set_model(selection: ModelSelection):
    if selection.model_key in available_models:
        return { "status": "success" }
    return { "status": "error", "message": "Invalid model" }
