# app/services/family_profile_service.py
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.connection import get_family_profiles_collection, get_user_profile_settings_collection
from app.models.family_profile import (
    FamilyProfile, 
    FamilyProfileCreate, 
    FamilyProfileUpdate,
    SystemRelationshipType,
    HealthInsightResponse
)
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

class FamilyProfileService:
    def __init__(self):
        self._profiles_collection: Optional[AsyncIOMotorCollection] = None
        self._user_profile_settings_collection: Optional[AsyncIOMotorCollection] = None

    async def get_profiles_collection(self) -> AsyncIOMotorCollection:
        """Get the family profiles collection"""
        if self._profiles_collection is None:
            self._profiles_collection = await get_family_profiles_collection()
        return self._profiles_collection

    async def get_user_settings_collection(self) -> AsyncIOMotorCollection:
        """Get the user profile settings collection"""
        if self._user_profile_settings_collection is None:
            self._user_profile_settings_collection = await get_user_profile_settings_collection()
        return self._user_profile_settings_collection

    async def create_profile(self, user_id: str, profile_data: FamilyProfileCreate) -> FamilyProfile:
        """Create a new family profile"""
        try:
            collection = await self.get_profiles_collection()
            
            # Create the profile - determine relationship type based on context
            profile_dict = profile_data.dict(exclude_unset=True)
            
            # Only set as FAMILY if not explicitly creating a self profile
            # The relationship_label can help identify self profiles
            if profile_dict.get('relationship_label', '').lower() in ['self', 'me', 'myself'] or profile_dict.get('name', '').lower() in ['my profile', 'me']:
                profile_dict['relationship'] = SystemRelationshipType.SELF
            else:
                profile_dict['relationship'] = SystemRelationshipType.FAMILY
            
            profile = FamilyProfile(
                user_id=user_id,
                **profile_dict
            )
            
            # Ensure health_info has default values if not provided
            if not hasattr(profile, 'health_info') or profile.health_info is None:
                from app.models.family_profile import HealthInformation
                profile.health_info = HealthInformation()
            
            # Insert into database
            result = await collection.insert_one(profile.dict())
            
            if not result.inserted_id:
                raise Exception("Failed to create profile")
            
            # If this is the user's first profile and it's 'self', set it as active
            existing_profiles = await self.get_profiles_by_user(user_id)
            if len(existing_profiles) == 1 and profile.relationship == SystemRelationshipType.SELF:
                await self.set_active_profile(user_id, profile.id)
            
            logger.info(f"Created family profile {profile.id} for user {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating family profile: {e}")
            raise

    async def get_profiles_by_user(self, user_id: str) -> List[FamilyProfile]:
        """Get all family profiles for a user"""
        try:
            collection = await self.get_profiles_collection()
            
            cursor = collection.find({"user_id": user_id, "is_active": True})
            profiles_data = await cursor.to_list(length=None)
            
            profiles = [FamilyProfile(**profile_data) for profile_data in profiles_data]
            return profiles
            
        except Exception as e:
            logger.error(f"Error fetching profiles for user {user_id}: {e}")
            return []

    async def get_profile_by_id(self, profile_id: str, user_id: str) -> Optional[FamilyProfile]:
        """Get a specific family profile by ID"""
        try:
            collection = await self.get_profiles_collection()
            
            profile_data = await collection.find_one({
                "id": profile_id,
                "user_id": user_id,
                "is_active": True
            })
            
            if not profile_data:
                return None
            
            return FamilyProfile(**profile_data)
            
        except Exception as e:
            logger.error(f"Error fetching profile {profile_id}: {e}")
            return None

    async def update_profile(self, profile_id: str, user_id: str, update_data: FamilyProfileUpdate) -> Optional[FamilyProfile]:
        """Update a family profile"""
        try:
            collection = await self.get_profiles_collection()
            
            # Prepare update data
            update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            # Update the profile
            result = await collection.update_one(
                {"id": profile_id, "user_id": user_id},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                return None
            
            # Return updated profile
            return await self.get_profile_by_id(profile_id, user_id)
            
        except Exception as e:
            logger.error(f"Error updating profile {profile_id}: {e}")
            return None

    async def delete_profile(self, profile_id: str, user_id: str) -> bool:
        """Soft delete a family profile"""
        try:
            collection = await self.get_profiles_collection()
            
            # Don't allow deletion of 'self' profile
            profile = await self.get_profile_by_id(profile_id, user_id)
            if profile and profile.relationship == SystemRelationshipType.SELF:
                logger.warning(f"Attempted to delete 'self' profile {profile_id}")
                return False
            
            # Soft delete the profile
            result = await collection.update_one(
                {"id": profile_id, "user_id": user_id},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            if result.matched_count == 0:
                return False
            
            # If this was the active profile, switch to 'self' profile
            active_profile_id = await self.get_active_profile_id(user_id)
            if active_profile_id == profile_id:
                self_profile = await self.get_self_profile(user_id)
                if self_profile:
                    await self.set_active_profile(user_id, self_profile.id)
            
            logger.info(f"Deleted family profile {profile_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting profile {profile_id}: {e}")
            return False

    async def get_self_profile(self, user_id: str) -> Optional[FamilyProfile]:
        """Get the user's 'self' profile"""
        try:
            collection = await self.get_profiles_collection()
            
            profile_data = await collection.find_one({
                "user_id": user_id,
                "relationship": SystemRelationshipType.SELF,
                "is_active": True
            })
            
            if not profile_data:
                return None
            
            return FamilyProfile(**profile_data)
            
        except Exception as e:
            logger.error(f"Error fetching self profile for user {user_id}: {e}")
            return None

    async def create_self_profile(self, user: User) -> FamilyProfile:
        """Create a 'self' profile for a new user"""
        try:
            profile_data = FamilyProfileCreate(
                name=user.full_name,
                relationship_label="Self",
                email=user.email,
                phone=user.phone,
                address=user.address
            )
            
            # Create profile with special handling for self
            profile_dict = profile_data.dict(exclude_unset=True)
            profile_dict['relationship'] = SystemRelationshipType.SELF
            
            profile = FamilyProfile(
                user_id=user.id,
                **profile_dict
            )
            
            collection = await self.get_profiles_collection()
            result = await collection.insert_one(profile.dict())
            
            if not result.inserted_id:
                raise Exception("Failed to create self profile")
            
            # Set as active profile
            await self.set_active_profile(user.id, profile.id)
            
            logger.info(f"Created self profile {profile.id} for user {user.id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating self profile for user {user.id}: {e}")
            raise

    async def set_active_profile(self, user_id: str, profile_id: str) -> bool:
        """Set the active profile for a user"""
        try:
            settings_collection = await self.get_user_settings_collection()
            
            # Verify the profile exists and belongs to the user
            profile = await self.get_profile_by_id(profile_id, user_id)
            if not profile:
                return False
            
            # Update user's active profile
            await settings_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "active_profile_id": profile_id,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Set active profile {profile_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error setting active profile: {e}")
            return False

    async def get_active_profile_id(self, user_id: str) -> Optional[str]:
        """Get the active profile ID for a user"""
        try:
            settings_collection = await self.get_user_settings_collection()
            
            settings = await settings_collection.find_one({"user_id": user_id})
            if settings and "active_profile_id" in settings:
                return settings["active_profile_id"]
            
            # Default to 'self' profile if no active profile is set
            self_profile = await self.get_self_profile(user_id)
            if self_profile:
                await self.set_active_profile(user_id, self_profile.id)
                return self_profile.id
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting active profile for user {user_id}: {e}")
            return None

    async def get_active_profile(self, user_id: str) -> Optional[FamilyProfile]:
        """Get the active family profile for a user"""
        try:
            active_profile_id = await self.get_active_profile_id(user_id)
            if not active_profile_id:
                return None
            
            return await self.get_profile_by_id(active_profile_id, user_id)
            
        except Exception as e:
            logger.error(f"Error getting active profile for user {user_id}: {e}")
            return None

    async def get_health_insights(self, profile_id: str, user_id: str) -> Optional[HealthInsightResponse]:
        """Generate health insights for a profile"""
        try:
            profile = await self.get_profile_by_id(profile_id, user_id)
            if not profile:
                return None
            
            # Calculate age if date of birth is available
            age = None
            age_group = None
            if profile.date_of_birth:
                today = date.today()
                age = today.year - profile.date_of_birth.year - ((today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day))
                
                if age < 18:
                    age_group = "pediatric"
                elif age < 65:
                    age_group = "adult"
                else:
                    age_group = "senior"
            
            # Generate risk factors based on health information
            risk_factors = []
            recommendations = []
            
            if profile.health_info.chronic_conditions:
                risk_factors.extend([f"Chronic condition: {condition}" for condition in profile.health_info.chronic_conditions])
            
            if profile.health_info.allergies:
                risk_factors.append(f"Has {len(profile.health_info.allergies)} known allergies")
            
            if profile.health_info.family_history:
                for condition, relatives in profile.health_info.family_history.items():
                    if relatives:
                        risk_factors.append(f"Family history of {condition}")
            
            # Generate age-based recommendations
            if age_group == "pediatric":
                recommendations.extend([
                    "Regular pediatric checkups",
                    "Vaccination schedule monitoring",
                    "Growth and development tracking"
                ])
            elif age_group == "adult":
                recommendations.extend([
                    "Annual health screenings",
                    "Regular blood pressure checks",
                    "Cholesterol monitoring"
                ])
            elif age_group == "senior":
                recommendations.extend([
                    "Regular bone density screening",
                    "Cardiovascular health monitoring",
                    "Cognitive health assessments"
                ])
            
            # Calculate simple health score (0-100)
            health_score = 100.0
            health_score -= len(profile.health_info.chronic_conditions) * 10
            health_score -= len(risk_factors) * 5
            health_score = max(0, min(100, health_score))
            
            return HealthInsightResponse(
                profile_id=profile_id,
                age_group=age_group,
                risk_factors=risk_factors,
                recommendations=recommendations,
                health_score=health_score
            )
            
        except Exception as e:
            logger.error(f"Error generating health insights for profile {profile_id}: {e}")
            return None

    async def has_permission(self, profile_id: str, user_id: str, permission: str) -> bool:
        """Check if a profile has a specific permission"""
        try:
            profile = await self.get_profile_by_id(profile_id, user_id)
            if not profile:
                return False
            
            return getattr(profile.permissions, permission, False)
            
        except Exception as e:
            logger.error(f"Error checking permission {permission} for profile {profile_id}: {e}")
            return False

# Create a singleton instance
family_profile_service = FamilyProfileService()