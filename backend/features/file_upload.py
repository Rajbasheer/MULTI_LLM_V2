import fitz  # PyMuPDF for PDF
import docx  # python-docx for DOCX
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

# === Extract text based on file extension ===
async def extract_text_from_upload(file: UploadFile) -> str:
    ext = Path(file.filename).suffix.lower()
    content = await file.read()

    try:
        if ext in [".txt", ".md"]:
            return content.decode("utf-8", errors="ignore")

        elif ext == ".pdf":
            with fitz.open(stream=content, filetype="pdf") as doc:
                return "\n".join(page.get_text() for page in doc)

        elif ext == ".docx":
            from io import BytesIO
            doc = docx.Document(BytesIO(content))
            return "\n".join([para.text for para in doc.paragraphs])

        else:
            return f"[Unsupported file type: {ext}]"

    except Exception as e:
        return f"[Error extracting text from {file.filename}: {str(e)}]"

# === Upload endpoint that returns extracted content (no DB, no disk save) ===
@router.post("/upload-preview")
async def upload_and_preview(file: UploadFile = File(...)):
    try:
        extracted_text = await extract_text_from_upload(file)
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "preview": extracted_text[:300],  # For front-end display
            "full_text": extracted_text       # Optional full text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
