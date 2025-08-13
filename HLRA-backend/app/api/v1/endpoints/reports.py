# app/endpoints/reports.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from app.models.health_data import LabReport, HealthParameter
from app.models.user import User
from app.services.data_service import data_service
from app.services.family_profile_service import family_profile_service
from app.core.auth import get_current_user
import logging
logger = logging.getLogger(__name__)

class StarRequest(BaseModel):
    is_starred: bool

router = APIRouter()

@router.get("/reports", response_model=List[LabReport])
async def get_all_reports(
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    current_user: User = Depends(get_current_user)
):
    """Get all reports for the current user, optionally filtered by profile"""
    try:
        # If no profile_id specified, use active profile - create one if needed
        if not profile_id:
            active_profile = await family_profile_service.get_active_profile(current_user.id)
            if not active_profile:
                # Auto-create self profile if none exists
                try:
                    active_profile = await family_profile_service.create_self_profile(current_user)
                    logger.info(f"Auto-created self profile for user {current_user.id} during report fetch")
                except Exception as e:
                    logger.warning(f"Failed to auto-create self profile during report fetch: {e}")
            
            if active_profile:
                profile_id = active_profile.id
        
        # Verify user has access to this profile
        if profile_id:
            profile = await family_profile_service.get_profile_by_id(profile_id, current_user.id)
            if not profile:
                raise HTTPException(status_code=403, detail="Access denied to this profile")
        
        reports = await data_service.get_reports_by_user_and_profile(
            user_id=current_user.id, 
            profile_id=profile_id
        )

        # Ensure we always return an array
        if reports is None:
            return []

        # Convert to list if it's not already
        if not isinstance(reports, list):
            return []

        return reports

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        return []  # Return empty array on error

@router.get("/reports/starred")
async def get_starred_reports(
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    current_user: User = Depends(get_current_user)
):
    """Get starred reports for the current user, optionally filtered by profile"""
    try:
        # If no profile_id specified, use active profile - create one if needed
        if not profile_id:
            active_profile = await family_profile_service.get_active_profile(current_user.id)
            if not active_profile:
                # Auto-create self profile if none exists
                try:
                    active_profile = await family_profile_service.create_self_profile(current_user)
                    logger.info(f"Auto-created self profile for user {current_user.id} during report fetch")
                except Exception as e:
                    logger.warning(f"Failed to auto-create self profile during report fetch: {e}")
            
            if active_profile:
                profile_id = active_profile.id
        
        # Verify user has access to this profile
        if profile_id:
            profile = await family_profile_service.get_profile_by_id(profile_id, current_user.id)
            if not profile:
                raise HTTPException(status_code=403, detail="Access denied to this profile")
        
        starred_reports = await data_service.get_starred_reports_by_user_and_profile(
            user_id=current_user.id,
            profile_id=profile_id
        )
        return starred_reports if starred_reports else []
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching starred reports: {e}")
        return []

@router.get("/reports/{report_id}", response_model=LabReport)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get specific report"""
    report = await data_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check if user has access to this report
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this report")
    
    # If report has a profile, verify user has access to that profile
    if report.profile_id:
        profile = await family_profile_service.get_profile_by_id(report.profile_id, current_user.id)
        if not profile:
            raise HTTPException(status_code=403, detail="Access denied to this report's profile")
    
    return report

@router.get("/reports/{report_id}/parameters", response_model=List[HealthParameter])
async def get_report_parameters(report_id: str):
    """Get parameters for specific report"""
    report = await data_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report.parameters

@router.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a specific report"""
    try:
        success = await data_service.delete_report(report_id)

        if not success:
            raise HTTPException(status_code=404, detail="Report not found")

        return {"message": "Report deleted successfully", "report_id": report_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/reports/{report_id}/download")
async def download_report(report_id: str):
    """Download a specific report file"""
    try:
        report = await data_service.get_report(report_id)

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # For now, return file info - you can implement actual file download later
        return {
            "download_url": f"/uploads/{report.filename}",
            "filename": report.filename,
            "file_path": report.file_path
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/reports/{report_id}/star")
async def toggle_report_star(report_id: str, star_request: StarRequest):
    """Toggle star status for a specific report"""
    try:
        result = await data_service.update_report_star(report_id, star_request.is_starred)
        
        if not result:
            raise HTTPException(status_code=404, detail="Report not found")
            
        return {
            "message": "Star status updated successfully",
            "report_id": report_id,
            "is_starred": star_request.is_starred
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating star status for report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")