from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserInDB(User):
    pass

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str