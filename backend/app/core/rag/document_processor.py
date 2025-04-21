import os
import logging
from typing import List, Dict, Any, Optional
import mimetypes
from pathlib import Path

# Document processing libraries
import PyPDF2
import docx
import pandas as pd
import csv
from bs4 import BeautifulSoup
import markdown
import json

from app.models.file import File
from app.schemas.search import DocumentChunk

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """
    Handles extraction of text content from various document types 
    and chunking for RAG pipeline
    """
    
    @staticmethod
    def process_file(file_path: str, file_obj: Optional[File] = None) -> List[DocumentChunk]:
        """
        Process a file and extract text content with metadata
        """
        # Determine file type if not provided
        if not file_obj:
            file_name = os.path.basename(file_path)
            file_type = mimetypes.guess_type(file_path)[0]
        else:
            file_name = file_obj.original_filename
            file_type = file_obj.file_type
            
        logger.info(f"Processing file: {file_name} of type {file_type}")
        
        # Extract text based on file type
        text_content = ""
        try:
            if file_type == 'application/pdf' or file_path.endswith('.pdf'):
                text_content = DocumentProcessor._extract_from_pdf(file_path)
            elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                              'application/msword'] or file_path.endswith(('.docx', '.doc')):
                text_content = DocumentProcessor._extract_from_docx(file_path)
            elif file_type in ['text/csv', 'application/csv'] or file_path.endswith('.csv'):
                text_content = DocumentProcessor._extract_from_csv(file_path)
            elif file_type in ['application/json'] or file_path.endswith('.json'):
                text_content = DocumentProcessor._extract_from_json(file_path)
            elif file_type in ['text/markdown'] or file_path.endswith(('.md', '.markdown')):
                text_content = DocumentProcessor._extract_from_markdown(file_path)
            elif file_type in ['text/html'] or file_path.endswith(('.html', '.htm')):
                text_content = DocumentProcessor._extract_from_html(file_path)
            elif file_type and file_type.startswith('text/') or file_path.endswith(('.txt', '.py', '.js', '.ts', '.jsx', '.tsx', '.css')):
                text_content = DocumentProcessor._extract_from_text(file_path)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return []
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            return []
        
        # Create chunks with metadata
        chunks = DocumentProcessor.chunk_text(
            text_content, 
            file_path=file_path, 
            file_name=file_name,
            file_type=file_type
        )
        
        logger.info(f"Created {len(chunks)} chunks from {file_name}")
        return chunks
    
    @staticmethod
    def chunk_text(
        text: str, 
        chunk_size: int = 1000, 
        chunk_overlap: int = 200, 
        **metadata
    ) -> List[DocumentChunk]:
        """
        Split text into chunks with specified size and overlap
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)
        
        chunk_id = 0
        while start < text_length:
            end = min(start + chunk_size, text_length)
            
            # Adjust end to avoid splitting in the middle of sentences if possible
            if end < text_length:
                # Try to find a sentence boundary
                for sentence_end in ['. ', '! ', '? ', '\n\n']:
                    last_period = text[start:end].rfind(sentence_end)
                    if last_period != -1:
                        end = start + last_period + len(sentence_end)
                        break
            
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(
                    DocumentChunk(
                        id=f"{metadata.get('file_name', 'text')}_chunk_{chunk_id}",
                        text=chunk_text,
                        metadata={
                            "chunk_id": chunk_id,
                            "start": start,
                            "end": end,
                            **metadata
                        }
                    )
                )
                chunk_id += 1
            
            # Move start position for next chunk, accounting for overlap
            start = end - chunk_overlap
            
            # Ensure we make progress
            if start >= text_length or start <= 0:
                break
                
        return chunks
    
    # File-specific extraction methods
    
    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        text = ""
        with open(file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        return text
    
    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        doc = docx.Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    
    @staticmethod
    def _extract_from_csv(file_path: str) -> str:
        text = ""
        try:
            df = pd.read_csv(file_path)
            text = df.to_string()
        except:
            # Fallback if pandas fails
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    text += " | ".join(row) + "\n"
        return text
    
    @staticmethod
    def _extract_from_json(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return json.dumps(data, indent=2)
    
    @staticmethod
    def _extract_from_markdown(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            md_text = f.read()
        # Convert markdown to plain text by removing markdown syntax
        html = markdown.markdown(md_text)
        soup = BeautifulSoup(html, features="html.parser")
        return soup.get_text()
    
    @staticmethod
    def _extract_from_html(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
        soup = BeautifulSoup(html, features="html.parser")
        return soup.get_text()
    
    @staticmethod
    def _extract_from_text(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            return f.read()