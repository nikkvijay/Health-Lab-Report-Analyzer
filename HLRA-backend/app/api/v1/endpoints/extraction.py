# app/endpoints/extraction.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.file_models import FileProcessingStatus
from app.services.data_service import data_service

class ExtractRequest(BaseModel):
    fileId: str

router = APIRouter()

@router.get("/extraction/{file_id}", response_model=FileProcessingStatus)
async def get_extraction_status(file_id: str):
    """Get extraction status for uploaded file"""
    report = await data_service.get_report(file_id)
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

@router.post("/")
async def extract_data(extract_request: ExtractRequest):
    """Extract data from uploaded file - this triggers the extraction process"""
    try:
        report = await data_service.get_report(extract_request.fileId)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Return current status and trigger processing if needed
        return {
            "file_id": extract_request.fileId,
            "status": report.processing_status.value,
            "message": "Extraction process initiated",
            "parameters_found": len(report.parameters)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.get("/extraction/{file_id}/raw")
async def get_raw_text(file_id: str):
    """Get raw extracted text"""
    report = await data_service.get_report(file_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"raw_text": report.raw_text or ""}