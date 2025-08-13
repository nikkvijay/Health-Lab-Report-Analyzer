# app/services/notification_service.py
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.connection import get_database
from app.models.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationType,
    NotificationPriority
)
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self._notifications_collection: Optional[AsyncIOMotorCollection] = None

    async def get_notifications_collection(self) -> AsyncIOMotorCollection:
        """Get the notifications collection"""
        if self._notifications_collection is None:
            db = await get_database()
            self._notifications_collection = db.notifications
        return self._notifications_collection

    async def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """Create a new notification"""
        try:
            collection = await self.get_notifications_collection()
            
            notification = Notification(**notification_data.dict())
            
            # Insert into database
            result = await collection.insert_one(notification.dict())
            
            if not result.inserted_id:
                raise Exception("Failed to create notification")
            
            logger.info(f"Created notification {notification.id} for user {notification.user_id}")
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise

    async def get_user_notifications(
        self, 
        user_id: str, 
        profile_id: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """Get notifications for a user"""
        try:
            collection = await self.get_notifications_collection()
            
            # Build query
            query = {"user_id": user_id}
            
            if profile_id:
                query["profile_id"] = profile_id
            
            if unread_only:
                query["is_read"] = False
            
            # Add expiration filter
            query["$or"] = [
                {"expires_at": None},
                {"expires_at": {"$gt": datetime.utcnow()}}
            ]
            
            cursor = collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
            notifications_data = await cursor.to_list(length=None)
            
            notifications = [Notification(**notif_data) for notif_data in notifications_data]
            return notifications
            
        except Exception as e:
            logger.error(f"Error fetching notifications for user {user_id}: {e}")
            return []

    async def get_notification(self, notification_id: str, user_id: str) -> Optional[Notification]:
        """Get a specific notification"""
        try:
            collection = await self.get_notifications_collection()
            
            notification_data = await collection.find_one({
                "id": notification_id,
                "user_id": user_id
            })
            
            if not notification_data:
                return None
            
            return Notification(**notification_data)
            
        except Exception as e:
            logger.error(f"Error fetching notification {notification_id}: {e}")
            return None

    async def update_notification(
        self, 
        notification_id: str, 
        user_id: str, 
        update_data: NotificationUpdate
    ) -> Optional[Notification]:
        """Update a notification"""
        try:
            collection = await self.get_notifications_collection()
            
            # Prepare update data
            update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
            
            # Set timestamps
            if update_data.is_read is True and 'read_at' not in update_dict:
                update_dict['read_at'] = datetime.utcnow()
            if update_data.is_dismissed is True and 'dismissed_at' not in update_dict:
                update_dict['dismissed_at'] = datetime.utcnow()
            
            result = await collection.update_one(
                {"id": notification_id, "user_id": user_id},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                return None
            
            return await self.get_notification(notification_id, user_id)
            
        except Exception as e:
            logger.error(f"Error updating notification {notification_id}: {e}")
            return None

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        update_data = NotificationUpdate(
            is_read=True,
            read_at=datetime.utcnow()
        )
        result = await self.update_notification(notification_id, user_id, update_data)
        return result is not None

    async def mark_all_as_read(self, user_id: str, profile_id: Optional[str] = None) -> int:
        """Mark all notifications as read for a user"""
        try:
            collection = await self.get_notifications_collection()
            
            query = {"user_id": user_id, "is_read": False}
            if profile_id:
                query["profile_id"] = profile_id
            
            result = await collection.update_many(
                query,
                {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
            )
            
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read for user {user_id}: {e}")
            return 0

    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification"""
        try:
            collection = await self.get_notifications_collection()
            
            result = await collection.delete_one({
                "id": notification_id,
                "user_id": user_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting notification {notification_id}: {e}")
            return False

    async def get_unread_count(self, user_id: str, profile_id: Optional[str] = None) -> int:
        """Get count of unread notifications"""
        try:
            collection = await self.get_notifications_collection()
            
            query = {
                "user_id": user_id, 
                "is_read": False,
                "$or": [
                    {"expires_at": None},
                    {"expires_at": {"$gt": datetime.utcnow()}}
                ]
            }
            
            if profile_id:
                query["profile_id"] = profile_id
            
            count = await collection.count_documents(query)
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread count for user {user_id}: {e}")
            return 0

    async def cleanup_expired_notifications(self) -> int:
        """Clean up expired notifications"""
        try:
            collection = await self.get_notifications_collection()
            
            result = await collection.delete_many({
                "expires_at": {"$lte": datetime.utcnow()}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired notifications")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired notifications: {e}")
            return 0

    # Health-specific notification creators
    async def create_health_alert(
        self, 
        user_id: str, 
        profile_id: str,
        parameter_name: str,
        value: str,
        status: str,
        report_id: str
    ):
        """Create a health parameter alert notification"""
        priority = NotificationPriority.HIGH if status == 'critical' else NotificationPriority.NORMAL
        
        notification_data = NotificationCreate(
            user_id=user_id,
            profile_id=profile_id,
            type=NotificationType.HEALTH_ALERT,
            priority=priority,
            title=f"Health Alert: {parameter_name}",
            message=f"Your {parameter_name} level is {status}: {value}. Please consult your healthcare provider if needed.",
            data={
                "parameter": parameter_name,
                "value": value,
                "status": status,
                "report_id": report_id
            },
            actions=[
                {"label": "View Report", "url": f"/reports/{report_id}"}
            ],
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        return await self.create_notification(notification_data)

    async def create_checkup_reminder(self, user_id: str, profile_id: str, days_since_last: int):
        """Create a checkup reminder notification"""
        notification_data = NotificationCreate(
            user_id=user_id,
            profile_id=profile_id,
            type=NotificationType.CHECKUP_REMINDER,
            priority=NotificationPriority.NORMAL,
            title="Regular Checkup Reminder",
            message=f"It's been {days_since_last} days since your last checkup. Consider scheduling your next appointment.",
            data={"days_since_last": days_since_last},
            actions=[
                {"label": "Schedule Appointment", "url": "/schedule"}
            ],
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        return await self.create_notification(notification_data)

    async def create_report_ready_notification(
        self, 
        user_id: str, 
        profile_id: str, 
        report_id: str, 
        filename: str
    ):
        """Create a notification when a report is ready"""
        notification_data = NotificationCreate(
            user_id=user_id,
            profile_id=profile_id,
            type=NotificationType.REPORT_READY,
            priority=NotificationPriority.NORMAL,
            title="Report Analysis Complete",
            message=f"Your lab report '{filename}' has been processed and is ready for review.",
            data={
                "report_id": report_id,
                "filename": filename
            },
            actions=[
                {"label": "View Report", "url": f"/reports/{report_id}"}
            ],
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        return await self.create_notification(notification_data)

# Create singleton instance
notification_service = NotificationService()