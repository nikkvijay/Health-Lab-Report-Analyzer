# app/models/notification.py
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid

class NotificationType(str, Enum):
    SYSTEM = "system"
    HEALTH_ALERT = "health_alert"
    REMINDER = "reminder"
    TREND_ALERT = "trend_alert"
    PARAMETER_ALERT = "parameter_alert"
    CHECKUP_REMINDER = "checkup_reminder"
    MEDICATION_REMINDER = "medication_reminder"
    REPORT_READY = "report_ready"
    PROFILE_UPDATE = "profile_update"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Recipient user
    profile_id: Optional[str] = None  # Associated profile if applicable
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    title: str
    message: str
    
    # Metadata
    data: Dict[str, Any] = {}  # Additional data for the notification
    
    # Status
    is_read: bool = False
    is_dismissed: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None  # Optional expiration
    
    # Delivery options
    show_toast: bool = True  # Show as toast notification
    persist: bool = True     # Keep in notification center
    
    # Actions (optional buttons/links)
    actions: List[Dict[str, str]] = []  # [{"label": "View Report", "url": "/reports/123"}]

class NotificationCreate(BaseModel):
    user_id: str
    profile_id: Optional[str] = None
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    title: str
    message: str
    data: Dict[str, Any] = {}
    show_toast: bool = True
    persist: bool = True
    expires_at: Optional[datetime] = None
    actions: List[Dict[str, str]] = []

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None

class NotificationResponse(BaseModel):
    id: str
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    is_dismissed: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    show_toast: bool
    persist: bool
    actions: List[Dict[str, str]]
    
    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    has_critical: bool = False