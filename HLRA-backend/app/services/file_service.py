import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from app.models.health_data import LabReport, FileStatus
from app.core.config import settings
from app.core.exceptions import FileUploadError, ValidationError

class FileService:
    def __init__(self):
        pass

    async def save_file(self, file: UploadFile, user_id: str) -> LabReport:
        """Save uploaded file and create LabReport"""
        # Validate file
        await self._validate_file(file)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{file_id}{file_ext}"
        
        # Ensure upload directory exists
        os.makedirs(settings.upload_dir, exist_ok=True)
        file_path = os.path.join(settings.upload_dir, filename)
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            raise FileUploadError(f"Failed to save file: {str(e)}")
        
        # Create LabReport
        lab_report = LabReport(
            id=file_id,
            user_id=user_id,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            upload_date=datetime.utcnow(),
            processing_status=FileStatus.UPLOADING,
            file_size=len(content),
            file_type=file.content_type or "unknown"
        )
        
        return lab_report

    async def _validate_file(self, file: UploadFile):
        """Validate uploaded file"""
        if not file.filename:
            raise ValidationError("No filename provided")
        
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.allowed_extensions:
            raise ValidationError(f"File type {file_ext} not allowed. Allowed types: {settings.allowed_extensions}")
        
        # Check file size
        content = await file.read()
        if len(content) > settings.max_file_size:
            raise ValidationError(f"File too large. Max size: {settings.max_file_size} bytes")
        
        # Reset file pointer
        await file.seek(0)

file_service = FileService()