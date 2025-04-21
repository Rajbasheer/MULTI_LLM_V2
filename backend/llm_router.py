import os
from dotenv import load_dotenv

from openai import OpenAI
import anthropic
import google.generativeai as genai

from models import MODELS

# Load environment variables
load_dotenv()

# === OpenAI (v1.75.0+) Client Setup ===
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# === OpenRouter Client Setup (also OpenAI-compatible client) ===
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# === Claude Setup ===
claude_client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# === Gemini Setup ===
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# === OPENAI Stream ===
async def stream_openai(messages: list, model_id: str):
    stream = openai_client.chat.completions.create(
        model=model_id,
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

# === CLAUDE Stream ===
async def stream_claude(messages: list, model_id: str):
    user_content = "\n".join([m["content"] for m in messages if m["role"] == "user"])
    with claude_client.messages.stream(
        model=model_id,
        messages=[{"role": "user", "content": user_content}],
        max_tokens=1024,
    ) as stream:
        for chunk in stream:
            if chunk.type == "content_block_delta":
                yield chunk.delta.text

# === GEMINI Stream ===
async def stream_gemini(messages: list, model_id: str):
    model = genai.GenerativeModel(model_id)
    prompt = "\n".join([m["content"] for m in messages])
    stream = model.generate_content(prompt, stream=True)
    for chunk in stream:
        if chunk.text:
            yield chunk.text

# === OPENROUTER Stream ===
async def stream_openrouter(messages: list, model_id: str):
    stream = openrouter_client.chat.completions.create(
        model=model_id,
        messages=messages,
        stream=True,
        extra_headers={
            "HTTP-Referer": "http://localhost:5173",  # Optional – for OpenRouter rankings
            "X-Title": "Multi-LLM Chat App"           # Optional – for OpenRouter rankings
        }
    )
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
