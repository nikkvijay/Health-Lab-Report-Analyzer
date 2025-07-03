from pathlib import Path
from typing import Optional, List
from fastapi import UploadFile, HTTPException
import aiofiles
import os
import uuid
from datetime import datetime
from app.models.health_data import LabReport, FileStatus
from app.core.config import settings

class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_upload_file(self, file: UploadFile, user_id: str) -> LabReport:
        try:
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = self.upload_dir / unique_filename

            # Save file asynchronously
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)

            # Create lab report entry
            report = LabReport(
                user_id=user_id,
                filename=unique_filename,
                original_filename=file.filename,
                file_path=str(file_path),
                upload_date=datetime.now(),
                processing_status=FileStatus.UPLOADING,
                file_size=len(content),
                file_type=file.content_type
            )

            return report
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

file_service = FileService()