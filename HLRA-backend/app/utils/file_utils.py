import os
import mimetypes
from typing import Optional

def get_file_type(filename: str) -> Optional[str]:
    """Get file MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type

def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0

def ensure_directory_exists(directory: str) -> bool:
    """Ensure directory exists, create if it doesn't"""
    try:
        os.makedirs(directory, exist_ok=True)
        return True
    except OSError:
        return False

def is_valid_filename(filename: str) -> bool:
    """Check if filename is valid"""
    if not filename or len(filename.strip()) == 0:
        return False
    
    # Check for invalid characters
    invalid_chars = '<>:"/\\|?*'
    return not any(char in filename for char in invalid_chars)