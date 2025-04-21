from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from datetime import datetime
import logging

from app.api.dependencies import get_db
from app.core.rag.document_processor import DocumentProcessor
from app.core.rag.embeddings import EmbeddingsManager
from app.core.rag.vector_store import VectorStore
from app.models.file import File as FileModel
from app.schemas.file import FileCreate, FileResponse, FileList
from app.utils.file_utils import save_upload_file, is_allowed_file
from app.config import settings

router = APIRouter(prefix="/files", tags=["files"])
logger = logging.getLogger(__name__)

# Initialize components
embeddings_manager = EmbeddingsManager()
vector_store = VectorStore()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a file and process it for the RAG pipeline
    """
    # Validate file type
    if not is_allowed_file(file.filename):
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}")
    
    # Create unique filename
    file_uuid = str(uuid.uuid4())
    filename = f"{file_uuid}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_FOLDER, filename)
    
    # Save file
    await save_upload_file(file, file_path)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    file_type = file.content_type or "application/octet-stream"
    
    # Create database entry
    db_file = FileModel(
        id=file_uuid,
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Process file in background for RAG
    background_tasks.add_task(process_file_for_rag, file_path, db_file.id)
    
    return FileResponse(
        id=db_file.id,
        filename=db_file.original_filename,
        file_type=db_file.file_type,
        file_size=db_file.file_size,
        created_at=db_file.created_at,
        is_indexed=False,  # Will be indexed in background
        download_url=f"/api/files/{db_file.id}/download"
    )

@router.get("", response_model=FileList)
async def list_files(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all uploaded files
    """
    files = db.query(FileModel).offset(skip).limit(limit).all()
    
    return FileList(
        files=[
            FileResponse(
                id=file.id,
                filename=file.original_filename,
                file_type=file.file_type,
                file_size=file.file_size,
                created_at=file.created_at,
                is_indexed=file.is_indexed,
                download_url=f"/api/files/{file.id}/download"
            )
            for file in files
        ],
        total=db.query(FileModel).count()
    )

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: str, db: Session = Depends(get_db)):
    """
    Get file details
    """
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        id=file.id,
        filename=file.original_filename,
        file_type=file.file_type,
        file_size=file.file_size,
        created_at=file.created_at,
        is_indexed=file.is_indexed,
        download_url=f"/api/files/{file.id}/download"
    )

@router.get("/{file_id}/download")
async def download_file(file_id: str, db: Session = Depends(get_db)):
    """
    Download a file
    """
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file.file_path,
        filename=file.original_filename,
        media_type=file.file_type
    )

@router.delete("/{file_id}")
async def delete_file(file_id: str, db: Session = Depends(get_db)):
    """
    Delete a file
    """
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete from disk
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    
    # Delete from vector store
    try:
        vector_store.delete_document(file_id)
    except Exception as e:
        logger.error(f"Error deleting file from vector store: {str(e)}")
    
    # Delete from database
    db.delete(file)
    db.commit()
    
    return {"detail": "File deleted successfully"}

# Background task for processing files
async def process_file_for_rag(file_path: str, file_id: str):
    """
    Process a file for the RAG pipeline
    """
    try:
        logger.info(f"Processing file for RAG: {file_path}")
        
        # Process document
        document_processor = DocumentProcessor()
        chunks = document_processor.process_file(
            file_path,
            {"file_id": file_id}
        )
        
        if not chunks:
            logger.warning(f"No chunks extracted from file: {file_path}")
            return
        
        # Generate embeddings
        documents_with_embeddings = embeddings_manager.get_document_embeddings(chunks)
        
        # Store in vector store
        vector_store.add_documents(documents_with_embeddings)
        
        # Update database
        db = next(get_db())
        file = db.query(FileModel).filter(FileModel.id == file_id).first()
        
        if file:
            file.is_indexed = True
            file.indexed_at = datetime.now()
            db.commit()
            
        logger.info(f"Successfully processed file for RAG: {file_path}")
    
    except Exception as e:
        logger.error(f"Error processing file for RAG: {str(e)}")