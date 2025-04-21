from services.openai_service import call_openai
from services.claude_service import call_claude

async def call_llm(model: str, message: str, stream: bool = False):
    if model.startswith("openai"):
        return call_openai(message, stream)
    elif model.startswith("claude"):
        return call_claude(message, stream)
    else:
        return lambda: iter(["data: Model not supported\n\n"]) if stream else "This model is not supported yet."
