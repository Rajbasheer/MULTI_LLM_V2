import os
import shutil
from fastapi import UploadFile
from typing import List
import magic
import aiofiles
from app.config import settings

def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in settings.ALLOWED_EXTENSIONS

async def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """
    Save an upload file to the specified destination
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # Save file
    async with aiofiles.open(destination, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)
    
    return destination

def get_mime_type(file_path: str) -> str:
    """
    Detect MIME type of a file
    """
    try:
        mime = magic.Magic(mime=True)
        return mime.from_file(file_path)
    except:
        # Fallback to guess based on extension
        import mimetypes
        return mimetypes.guess_type(file_path)[0] or 'application/octet-stream'

def get_file_size(file_path: str) -> int:
    """
    Get file size in bytes
    """
    return os.path.getsize(file_path)