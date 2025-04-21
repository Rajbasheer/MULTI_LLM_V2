import os
import zipfile
import tempfile
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def create_zip_file(
    files: List[Dict[str, Any]],
    include_readme: bool = True,
    readme_content: Optional[str] = None
) -> str:
    """
    Create a ZIP file with structured contents
    
    Args:
        files: List of file dictionaries with file_path and structure_path
        include_readme: Whether to include a README file
        readme_content: Custom README content
        
    Returns:
        Path to the created ZIP file
    """
    # Create temporary directory for ZIP file
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, "export.zip")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add files to ZIP
            for file_info in files:
                file_path = file_info["file_path"]
                structure_path = file_info.get("structure_path", os.path.basename(file_path))
                
                if os.path.exists(file_path):
                    zipf.write(file_path, structure_path)
                else:
                    logger.warning(f"File not found: {file_path}")
            
            # Add README if requested
            if include_readme:
                readme = readme_content or "# Exported Files\n\nThis ZIP archive contains exported files from the LLM Platform."
                zipf.writestr("README.md", readme)
        
        return zip_path
    
    except Exception as e:
        logger.error(f"Error creating ZIP file: {str(e)}")
        if os.path.exists(zip_path):
            os.remove(zip_path)
        return None