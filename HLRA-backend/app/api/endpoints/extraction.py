# app/api/endpoints/extraction.py
from fastapi import APIRouter, HTTPException, Depends
from app.models.file_models import FileProcessingStatus
from app.models.health_data import LabReport
from app.models.auth import User
from app.services.data_service import data_service
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/extraction/{file_id}", response_model=FileProcessingStatus)
async def get_extraction_status(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get extraction status for uploaded file"""
    report = data_service.get_report(file_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Calculate progress based on status
    progress_map = {
        "uploading": 20,
        "processing": 60,
        "completed": 100,
        "failed": 0
    }
    
    return FileProcessingStatus(
        file_id=file_id,
        status=report.processing_status.value,
        progress=progress_map.get(report.processing_status.value, 0),
        message=f"Status: {report.processing_status.value}",
        parameters_found=len(report.parameters),
        error=report.error_message
    )

@router.get("/extraction/{file_id}/raw")
async def get_raw_text(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get raw extracted text"""
    report = data_service.get_report(file_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"raw_text": report.raw_text or ""}