import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi import Path as FastPath
from pathlib import Path
from sqlalchemy.orm import Session
from db.models_db import SessionLocal, BRDUpload

import fitz  # PyMuPDF for PDF
import docx  # python-docx for Word

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# === Text extraction based on file extension ===
def extract_text_from_file(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()

    if ext in [".txt", ".md"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            return f"[Error reading {ext} file: {str(e)}]"

    elif ext == ".pdf":
        try:
            text = ""
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            return f"[Error reading PDF: {str(e)}]"

    elif ext == ".docx":
        try:
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            return f"[Error reading DOCX: {str(e)}]"

    return f"[Unsupported file type: {ext}]"

# === Save metadata and content to SQLite ===
def save_to_db(filename: str, filetype: str, content: str):
    session: Session = SessionLocal()
    try:
        record = BRDUpload(
            filename=filename,
            filetype=filetype,
            content_preview=content[:300],
            full_content=content
        )
        session.add(record)
        session.commit()
        return record.id
    finally:
        session.close()

# === Upload endpoint ===
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        contents = await file.read()

        # Save the uploaded file
        with open(file_path, "wb") as f:
            f.write(contents)

        # Extract and store content
        extracted_text = extract_text_from_file(file_path)
        db_id = save_to_db(file.filename, file.content_type, extracted_text)

        return {
            "success": True,
            "file_id": db_id,
            "filename": file.filename,
            "preview": extracted_text[:300]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === Delete endpoint ===    
@router.delete("/file/{file_id}")
def delete_uploaded_file(file_id: int = FastPath(..., description="ID of the file to delete")):
    session: Session = SessionLocal()

    try:
        file = session.query(BRDUpload).filter(BRDUpload.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Delete physical file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete DB record
        session.delete(file)
        session.commit()

        return {
            "success": True,
            "message": f"File '{file.filename}' (ID: {file.id}) deleted successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        session.close()

