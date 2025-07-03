from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from app.models.health_data import LabReport, HealthParameter
from app.models.auth import User
from app.services.data_service import data_service
from app.api.deps import get_current_active_user
from ...utils.ocr_processor import OCRProcessor
import os
from ...core.config import settings

router = APIRouter()
ocr_processor = OCRProcessor()

@router.get("/reports", response_model=List[LabReport])
async def get_user_reports(
    current_user: User = Depends(get_current_active_user)
):
    """Get all reports for current user"""
    reports = data_service.get_user_reports(current_user.id)
    return reports

@router.get("/reports/{report_id}", response_model=LabReport)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get specific report"""
    report = data_service.get_report(report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/reports/{report_id}/parameters", response_model=List[HealthParameter])
async def get_report_parameters(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get parameters for specific report"""
    report = data_service.get_report(report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report.parameters

@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a report"""
    success = data_service.delete_report(report_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@router.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    try:
        # Create upload directory if it doesn't exist
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # Save uploaded file
        file_path = os.path.join(settings.upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Process the file based on its type
        if file.filename.lower().endswith('.pdf'):
            text = ocr_processor.extract_text_from_pdf(file_path)
        else:
            text = ocr_processor.extract_text_from_image(file_path)

        # Parse the extracted text
        results = ocr_processor.parse_lab_results(text)

        return {
            "success": True,
            "message": "File processed successfully",
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))