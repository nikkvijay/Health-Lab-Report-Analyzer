from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    status: str
    message: str
    upload_date: datetime

class FileProcessingStatus(BaseModel):
    file_id: str
    status: str
    progress: int  # 0-100
    message: str
    parameters_found: int = 0
    error: Optional[str] = None

class FileValidation(BaseModel):
    is_valid: bool
    file_type: str
    file_size: int
    errors: List[str] = []