from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FileBase(BaseModel):
    """Base schema for file operations"""
    filename: str
    file_type: str
    file_size: int

class FileCreate(FileBase):
    """Schema for file creation"""
    pass

class FileResponse(FileBase):
    """Schema for file response"""
    id: str
    created_at: datetime
    is_indexed: bool = False
    download_url: str

    class Config:
        from_attributes = True

class FileList(BaseModel):
    """Schema for file list response"""
    files: List[FileResponse]
    total: int