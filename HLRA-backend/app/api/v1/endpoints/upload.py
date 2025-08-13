# app/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from app.models.file_models import FileUploadResponse
from app.models.user import UserInDB
from app.services.file_service import file_service
from app.services.data_service import data_service
from app.services.family_profile_service import family_profile_service
from app.core.exceptions import FileUploadError, ValidationError
from app.core.auth import get_current_active_user

router = APIRouter()

async def process_uploaded_file(report_id: str):
    """Background task to process uploaded file with proper resource management"""
    from app.services.ocr_service import ocr_service
    from app.services.extraction_service import extraction_service
    from app.services.notification_service import notification_service
    from app.models.health_data import FileStatus
    import logging
    import gc
    import psutil
    import os
    
    logger = logging.getLogger(__name__)
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    
    logger.info(f"Starting background processing for report: {report_id} (Memory: {initial_memory:.2f}MB)")
    
    report = None
    raw_text = None
    parameters = None
    
    try:
        # Get report
        report = await data_service.get_report(report_id)
        if not report:
            logger.error(f"Report not found: {report_id}")
            return
        
        # Update status to processing
        report.processing_status = FileStatus.PROCESSING
        await data_service.update_report(report)
        logger.info(f"Report {report_id} status updated to processing")
        
        # Extract text with memory monitoring
        try:
            raw_text = ocr_service.extract_text_from_file(report.file_path)
            report.raw_text = raw_text
            logger.info(f"Raw text extracted for report {report_id}, length: {len(raw_text) if raw_text else 0}")
            
            # Memory checkpoint
            current_memory = process.memory_info().rss / 1024 / 1024
            logger.info(f"Memory after OCR: {current_memory:.2f}MB")
            
        except Exception as ocr_error:
            logger.error(f"OCR extraction failed for report {report_id}: {ocr_error}")
            raise ocr_error
        
        # Extract parameters with cleanup
        try:
            parameters = extraction_service.extract_parameters(raw_text)
            report.parameters = parameters
            logger.info(f"Parameters extracted for report {report_id}, count: {len(parameters)}")
            
            # Clear raw_text from memory after parameter extraction
            del raw_text
            gc.collect()
            
        except Exception as extraction_error:
            logger.error(f"Parameter extraction failed for report {report_id}: {extraction_error}")
            raise extraction_error
        
        # Update status to completed
        report.processing_status = FileStatus.COMPLETED
        await data_service.update_report(report)
        logger.info(f"Report {report_id} processing completed successfully")
        
        # Create notification for report completion
        try:
            await notification_service.create_report_ready_notification(
                user_id=report.user_id,
                profile_id=report.profile_id,
                report_id=report.id,
                filename=report.original_filename
            )
            
            # Check for health alerts in parameters
            for param in parameters:
                if param.status in ['high', 'low', 'critical']:
                    await notification_service.create_health_alert(
                        user_id=report.user_id,
                        profile_id=report.profile_id,
                        parameter_name=param.name,
                        value=str(param.value),
                        status=param.status,
                        report_id=report.id
                    )
                    
        except Exception as notif_error:
            logger.error(f"Error creating notifications for report {report_id}: {notif_error}")
            # Don't fail the whole process if notification creation fails
        
    except Exception as e:
        logger.error(f"Error processing report {report_id}: {e}")
        # Update status to failed
        try:
            report = await data_service.get_report(report_id)
            if report:
                report.processing_status = FileStatus.FAILED
                report.error_message = str(e)
                await data_service.update_report(report)
        except Exception as update_error:
            logger.error(f"Error updating failed status for report {report_id}: {update_error}")
    
    finally:
        # Cleanup resources and log memory usage
        try:
            # Clear all variables from memory
            if 'raw_text' in locals():
                del raw_text
            if 'parameters' in locals():
                del parameters
            if 'report' in locals():
                del report
            
            # Force garbage collection
            gc.collect()
            
            # Log final memory usage
            final_memory = process.memory_info().rss / 1024 / 1024
            memory_diff = final_memory - initial_memory
            logger.info(f"Background task completed for {report_id}. Memory: {final_memory:.2f}MB (Δ{memory_diff:+.2f}MB)")
            
        except Exception as cleanup_error:
            logger.error(f"Error during cleanup for report {report_id}: {cleanup_error}")

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Upload and process lab report file"""
    try:
        # Get user's active profile - create self profile if none exists
        active_profile = await family_profile_service.get_active_profile(current_user.id)
        if not active_profile:
            # Auto-create self profile if none exists
            try:
                active_profile = await family_profile_service.create_self_profile(current_user)
                logger.info(f"Auto-created self profile for user {current_user.id} during upload")
            except Exception as e:
                logger.warning(f"Failed to auto-create self profile during upload: {e}")
        
        profile_id = active_profile.id if active_profile else None
        
        # Save file
        lab_report = await file_service.save_file(file, current_user.id)
        
        # Associate with active profile
        if profile_id:
            lab_report.profile_id = profile_id
        
        # Save to database
        await data_service.save_report(lab_report)
        
        # Start background processing
        background_tasks.add_task(process_uploaded_file, lab_report.id)
        
        return FileUploadResponse(
            id=lab_report.id,
            file_id=lab_report.id,
            filename=lab_report.filename,
            original_filename=lab_report.original_filename,
            status="uploaded",
            processing_status="processing",  # Set to processing since background task started
            message="File uploaded successfully. Processing started.",
            upload_date=lab_report.upload_date,
            parameters_count=0  # Will be updated during processing
        )
        
    except (FileUploadError, ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")