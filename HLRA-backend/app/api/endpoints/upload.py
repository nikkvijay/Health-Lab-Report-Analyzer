# app/api/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from app.models.file_models import FileUploadResponse
from app.models.auth import User
from app.services.file_service import file_service
from app.services.data_service import data_service
from app.api.deps import get_current_active_user
from app.core.exceptions import FileUploadError, ValidationError

router = APIRouter()

async def process_uploaded_file(report_id: str):
    """Background task to process uploaded file"""
    from app.services.ocr_service import ocr_service
    from app.services.extraction_service import extraction_service
    from app.models.health_data import FileStatus
    
    try:
        # Get report
        report = data_service.reports_db.get(report_id)
        if not report:
            return
        
        # Update status to processing
        report.processing_status = FileStatus.PROCESSING
        data_service.save_report(report)
        
        # Extract text
        raw_text = ocr_service.extract_text_from_file(report.file_path)
        report.raw_text = raw_text
        
        # Extract parameters
        parameters = extraction_service.extract_parameters(raw_text)
        report.parameters = parameters
        
        # Update status to completed
        report.processing_status = FileStatus.COMPLETED
        data_service.save_report(report)
        
    except Exception as e:
        # Update status to failed
        if report:
            report.processing_status = FileStatus.FAILED
            report.error_message = str(e)
            data_service.save_report(report)

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload and process lab report file"""
    try:
        # Save file
        lab_report = await file_service.save_file(file, current_user.id)
        
        # Save to database
        data_service.save_report(lab_report)
        
        # Start background processing
        background_tasks.add_task(process_uploaded_file, lab_report.id)
        
        return FileUploadResponse(
            file_id=lab_report.id,
            filename=lab_report.original_filename,
            status="uploaded",
            message="File uploaded successfully. Processing started.",
            upload_date=lab_report.upload_date
        )
        
    except (FileUploadError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")