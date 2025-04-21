from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from app.api.routes import auth, chat, files, models, search, code
from app.database import Base, engine
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LLM Platform API",
    description="API for multi-LLM platform with RAG pipeline",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded content
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_FOLDER), name="uploads")

# Include API routes
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(code.router, prefix="/api", tags=["code"])

@app.on_event("startup")
async def startup_event():
    # Create database tables (in development)
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
    logger.info("Application startup complete")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)