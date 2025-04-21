from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    # Base settings
    APP_NAME: str = "LLM Platform"
    APP_URL: str = "http://localhost:8000"  # Used for OpenRouter API
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # In production, use a proper secret
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # File upload settings
    UPLOAD_FOLDER: str = os.path.join(Path(__file__).parent.parent, "uploads")
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = [
        "txt", "pdf", "doc", "docx", "csv", "xls", "xlsx", "json", 
        "py", "js", "ts", "jsx", "tsx", "html", "css", "md",
        "png", "jpg", "jpeg", "gif"
    ]
    
    # Vector database settings
    VECTOR_DB_PATH: str = os.path.join(Path(__file__).parent.parent, "vectordb")
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # FAISS specific settings
    FAISS_INDEX_TYPE: str = "flat"  # Options: flat, ivf, ivfpq
    FAISS_NLIST: int = 100  # Number of clusters for IVF indexes
    FAISS_NPROBE: int = 10  # Number of clusters to visit during search
    
    # LLM Provider API Keys (in production, these should be secured)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    
    # Llama settings
    LLAMA_DEFAULT_MODEL: str = "llama3-70b-8192"  # Default Llama model to use via OpenRouter
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure necessary directories exist
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)