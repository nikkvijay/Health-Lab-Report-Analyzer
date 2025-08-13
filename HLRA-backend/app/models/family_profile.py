# app/models/family_profile.py
from datetime import datetime, date
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
import uuid

# Keep some system relationship types for internal logic
class SystemRelationshipType(str, Enum):
    SELF = "self"
    FAMILY = "family"  # Generic family member

class BloodType(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "Unknown"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None

class HealthInformation(BaseModel):
    chronic_conditions: List[str] = []
    medications: List[str] = []
    allergies: List[str] = []
    previous_surgeries: List[str] = []
    family_history: Dict[str, List[str]] = {}
    notes: Optional[str] = None

class ChildSettings(BaseModel):
    parental_controls: bool = True
    age_verification: bool = True
    restricted_access: bool = True
    guardian_notifications: bool = True
    allowed_actions: List[str] = ["view_reports", "view_trends"]
    blocked_actions: List[str] = ["share_reports", "export_data"]

class ProfilePermissions(BaseModel):
    can_view_reports: bool = True
    can_upload_reports: bool = False
    can_share_reports: bool = False
    can_export_data: bool = False
    can_manage_settings: bool = False
    can_delete_reports: bool = False
    can_invite_users: bool = False

class FamilyProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Owner of this family profile
    name: str  # User-defined profile name (e.g., "Mom", "John", "My Son", "Grandpa Joe")
    relationship: SystemRelationshipType  # Only "self" or "family"
    relationship_label: Optional[str] = None  # User-defined relationship (e.g., "Mother", "Son", "Husband", "Best Friend")
    
    # Personal Information
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    
    # Health Information
    health_info: HealthInformation = Field(default_factory=HealthInformation)
    
    # Emergency Contacts
    emergency_contacts: List[EmergencyContact] = []
    
    # Profile Settings
    permissions: ProfilePermissions = Field(default_factory=ProfilePermissions)
    child_settings: Optional[ChildSettings] = None
    
    # Profile Management
    is_active: bool = True
    avatar: Optional[str] = None
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    metadata: Dict[str, Any] = {}

    @validator('permissions', always=True)
    def set_permissions(cls, v, values):
        """Set default permissions based on relationship"""
        if values.get('relationship') == SystemRelationshipType.SELF:
            # Full permissions for self
            return ProfilePermissions(
                can_view_reports=True,
                can_upload_reports=True,
                can_share_reports=True,
                can_export_data=True,
                can_manage_settings=True,
                can_delete_reports=True,
                can_invite_users=True
            )
        else:
            # Default permissions for family members
            return ProfilePermissions(
                can_view_reports=True,
                can_upload_reports=True,
                can_share_reports=False,
                can_export_data=False,
                can_manage_settings=False,
                can_delete_reports=False,
                can_invite_users=False
            )

class FamilyProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Profile name (e.g., 'Mom', 'John', 'My Daughter')")
    relationship_label: Optional[str] = Field(None, max_length=50, description="Relationship description (e.g., 'Mother', 'Son', 'Friend')")
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    health_info: Optional[HealthInformation] = None
    emergency_contacts: List[EmergencyContact] = []
    permissions: Optional[ProfilePermissions] = None
    notes: Optional[str] = None

class FamilyProfileUpdate(BaseModel):
    name: Optional[str] = None
    relationship_label: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    health_info: Optional[HealthInformation] = None
    emergency_contacts: Optional[List[EmergencyContact]] = None
    permissions: Optional[ProfilePermissions] = None
    child_settings: Optional[ChildSettings] = None
    is_active: Optional[bool] = None
    avatar: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FamilyProfileResponse(BaseModel):
    id: str
    name: str
    relationship: SystemRelationshipType
    relationship_label: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    health_info: HealthInformation
    emergency_contacts: List[EmergencyContact]
    permissions: ProfilePermissions
    child_settings: Optional[ChildSettings] = None
    is_active: bool
    avatar: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FamilyProfileListResponse(BaseModel):
    profiles: List[FamilyProfileResponse]
    total: int
    active_profile_id: Optional[str] = None

class ActiveProfileRequest(BaseModel):
    profile_id: str

class HealthInsightResponse(BaseModel):
    profile_id: str
    age_group: Optional[str] = None
    risk_factors: List[str] = []
    recommendations: List[str] = []
    health_score: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)