# app/api/v1/endpoints/notifications.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.models.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationUpdate,
    NotificationCreate
)
from app.models.user import User
from app.services.notification_service import notification_service
from app.core.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(50, le=100, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user"""
    try:
        notifications = await notification_service.get_user_notifications(
            user_id=current_user.id,
            profile_id=profile_id,
            unread_only=unread_only,
            limit=limit,
            offset=offset
        )
        
        # Get counts
        unread_count = await notification_service.get_unread_count(
            user_id=current_user.id,
            profile_id=profile_id
        )
        
        # Check for critical notifications
        has_critical = any(notif.priority == "critical" for notif in notifications if not notif.is_read)
        
        notification_responses = [NotificationResponse(**notif.dict()) for notif in notifications]
        
        return NotificationListResponse(
            notifications=notification_responses,
            total=len(notification_responses),
            unread_count=unread_count,
            has_critical=has_critical
        )
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@router.get("/notifications/unread-count")
async def get_unread_count(
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    try:
        count = await notification_service.get_unread_count(
            user_id=current_user.id,
            profile_id=profile_id
        )
        
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail="Failed to get unread count")

@router.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific notification"""
    try:
        notification = await notification_service.get_notification(
            notification_id=notification_id,
            user_id=current_user.id
        )
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return NotificationResponse(**notification.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notification {notification_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notification")

@router.patch("/notifications/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a notification (mark as read/dismissed)"""
    try:
        notification = await notification_service.update_notification(
            notification_id=notification_id,
            user_id=current_user.id,
            update_data=update_data
        )
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return NotificationResponse(**notification.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification {notification_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    try:
        success = await notification_service.mark_as_read(
            notification_id=notification_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as read", "notification_id": notification_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        count = await notification_service.mark_all_as_read(
            user_id=current_user.id,
            profile_id=profile_id
        )
        
        return {
            "message": f"Marked {count} notifications as read",
            "marked_count": count
        }
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        success = await notification_service.delete_notification(
            notification_id=notification_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification deleted", "notification_id": notification_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")

@router.post("/notifications", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new notification (admin/system use)"""
    try:
        # Ensure the notification is for the current user (security check)
        notification_data.user_id = current_user.id
        
        notification = await notification_service.create_notification(notification_data)
        
        return NotificationResponse(**notification.dict())
        
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to create notification")