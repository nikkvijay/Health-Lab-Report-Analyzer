# app/api/v1/endpoints/family_profiles.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.family_profile import (
    FamilyProfile,
    FamilyProfileCreate,
    FamilyProfileUpdate,
    FamilyProfileResponse,
    FamilyProfileListResponse,
    ActiveProfileRequest,
    HealthInsightResponse
)
from app.models.user import User
from app.services.family_profile_service import family_profile_service
from app.core.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/family-profiles", response_model=FamilyProfileResponse)
async def create_family_profile(
    profile_data: FamilyProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new family profile"""
    try:
        # Validate required fields
        if not profile_data.name or len(profile_data.name.strip()) == 0:
            raise HTTPException(status_code=422, detail="Profile name is required")
        
        profile = await family_profile_service.create_profile(
            user_id=current_user.id,
            profile_data=profile_data
        )
        
        return FamilyProfileResponse(**profile.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating family profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create family profile: {str(e)}")

@router.get("/family-profiles", response_model=FamilyProfileListResponse)
async def get_family_profiles(current_user: User = Depends(get_current_user)):
    """Get all family profiles for the current user"""
    try:
        profiles = await family_profile_service.get_profiles_by_user(current_user.id)
        active_profile_id = await family_profile_service.get_active_profile_id(current_user.id)
        
        profile_responses = [FamilyProfileResponse(**profile.dict()) for profile in profiles]
        
        return FamilyProfileListResponse(
            profiles=profile_responses,
            total=len(profile_responses),
            active_profile_id=active_profile_id
        )
        
    except Exception as e:
        logger.error(f"Error fetching family profiles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch family profiles")

@router.get("/family-profiles/{profile_id}", response_model=FamilyProfileResponse)
async def get_family_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific family profile"""
    try:
        profile = await family_profile_service.get_profile_by_id(profile_id, current_user.id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="Family profile not found")
        
        return FamilyProfileResponse(**profile.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching family profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch family profile")

@router.put("/family-profiles/{profile_id}", response_model=FamilyProfileResponse)
async def update_family_profile(
    profile_id: str,
    update_data: FamilyProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a family profile"""
    try:
        profile = await family_profile_service.update_profile(
            profile_id=profile_id,
            user_id=current_user.id,
            update_data=update_data
        )
        
        if not profile:
            raise HTTPException(status_code=404, detail="Family profile not found")
        
        return FamilyProfileResponse(**profile.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating family profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update family profile")

@router.delete("/family-profiles/{profile_id}")
async def delete_family_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a family profile"""
    try:
        success = await family_profile_service.delete_profile(profile_id, current_user.id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Family profile not found or cannot be deleted")
        
        return {"message": "Family profile deleted successfully", "profile_id": profile_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting family profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete family profile")

@router.post("/family-profiles/set-active")
async def set_active_profile(
    request: ActiveProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Set the active family profile"""
    try:
        success = await family_profile_service.set_active_profile(
            user_id=current_user.id,
            profile_id=request.profile_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Family profile not found")
        
        return {
            "message": "Active profile updated successfully",
            "active_profile_id": request.profile_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting active profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to set active profile")

@router.get("/family-profiles/active/current", response_model=FamilyProfileResponse)
async def get_active_profile(current_user: User = Depends(get_current_user)):
    """Get the current active family profile"""
    try:
        profile = await family_profile_service.get_active_profile(current_user.id)
        
        if not profile:
            # Create a self profile if none exists
            profile = await family_profile_service.create_self_profile(current_user)
        
        return FamilyProfileResponse(**profile.dict())
        
    except Exception as e:
        logger.error(f"Error fetching active profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch active profile")

@router.get("/family-profiles/{profile_id}/health-insights", response_model=HealthInsightResponse)
async def get_health_insights(
    profile_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get health insights for a family profile"""
    try:
        insights = await family_profile_service.get_health_insights(profile_id, current_user.id)
        
        if not insights:
            raise HTTPException(status_code=404, detail="Family profile not found")
        
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating health insights for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate health insights")

@router.get("/family-profiles/{profile_id}/permissions/{permission}")
async def check_profile_permission(
    profile_id: str,
    permission: str,
    current_user: User = Depends(get_current_user)
):
    """Check if a profile has a specific permission"""
    try:
        has_permission = await family_profile_service.has_permission(
            profile_id=profile_id,
            user_id=current_user.id,
            permission=permission
        )
        
        return {
            "profile_id": profile_id,
            "permission": permission,
            "has_permission": has_permission
        }
        
    except Exception as e:
        logger.error(f"Error checking permission {permission} for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to check permission")

@router.post("/family-profiles/initialize-self")
async def initialize_self_profile(current_user: User = Depends(get_current_user)):
    """Initialize a self profile for a user (called during registration/first login)"""
    try:
        # Check if user already has a self profile
        existing_profile = await family_profile_service.get_self_profile(current_user.id)
        if existing_profile:
            return {
                "message": "Self profile already exists",
                "profile": FamilyProfileResponse(**existing_profile.dict())
            }
        
        # Create self profile
        profile = await family_profile_service.create_self_profile(current_user)
        
        return {
            "message": "Self profile created successfully",
            "profile": FamilyProfileResponse(**profile.dict())
        }
        
    except Exception as e:
        logger.error(f"Error initializing self profile for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize self profile")