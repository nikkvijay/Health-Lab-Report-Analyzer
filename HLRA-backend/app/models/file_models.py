from datetime import datetime
from pydantic import BaseModel
from typing import Optional
class FileUploadResponse(BaseModel):
      id: str  # For frontend compatibility
      file_id: str  # Keep for backward compatibility
      filename: str
      original_filename: str
      status: str
      message: str
      upload_date: datetime
      processing_status: str
      parameters_count: int = 0

class FileProcessingStatus(BaseModel):
      file_id: str
      status: str
      progress: int
      message: str
      parameters_found: int
      error: Optional[str] = None