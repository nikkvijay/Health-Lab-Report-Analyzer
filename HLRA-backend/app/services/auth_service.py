from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User, UserCreate, UserInDB, UserLogin, UserUpdate, Token
from app.core.config import settings

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.users

    async def create_user(self, user_create: UserCreate) -> UserInDB:
        # Check if user already exists
        existing_user = await self.collection.find_one({"email": user_create.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        hashed_password = get_password_hash(user_create.password)
        user_data = User(
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hashed_password
        )

        # Insert user to database
        result = await self.collection.insert_one(user_data.dict())
        if result.inserted_id:
            user_data.id = str(result.inserted_id)
            return UserInDB(**user_data.dict())
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

    async def authenticate_user(self, user_login: UserLogin) -> Optional[UserInDB]:
        user = await self.collection.find_one({"email": user_login.email})
        if not user:
            return None
        
        if not verify_password(user_login.password, user["hashed_password"]):
            return None
        
        # Update last login
        await self.collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        user["id"] = str(user["_id"])
        return UserInDB(**user)

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        user = await self.collection.find_one({"email": email})
        if user:
            user["id"] = str(user["_id"])
            return UserInDB(**user)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        from bson import ObjectId
        try:
            user = await self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
                return UserInDB(**user)
        except Exception:
            pass
        return None

    def create_tokens(self, user: UserInDB) -> Token:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = create_access_token(
            subject=user.email, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            subject=user.email, expires_delta=refresh_token_expires
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def refresh_access_token(self, refresh_token: str) -> Token:
        from app.core.security import verify_refresh_token
        
        email = verify_refresh_token(refresh_token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user = await self.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return self.create_tokens(user)

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        """Update user profile information"""
        from bson import ObjectId
        
        try:
            # Create update data, only including non-None fields
            update_data = {k: v for k, v in user_update.dict(exclude_unset=True).items() if v is not None}
            
            if not update_data:
                # No fields to update
                return await self.get_user_by_id(user_id)
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update user in database
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Return updated user
                return await self.get_user_by_id(user_id)
            else:
                # User not found or no changes made
                return None
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user: {str(e)}"
            )