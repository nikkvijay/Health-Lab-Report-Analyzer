from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from app.services.auth_service import AuthService
from app.database.connection import get_database
from app.models.user import UserInDB
from typing import Optional

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
) -> UserInDB:
    """
    Dependency to get the current authenticated user
    """
    import logging
    logger = logging.getLogger(__name__)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        logger.warning("🚫 No credentials provided - Authorization header missing")
        raise credentials_exception

    token = credentials.credentials
    logger.info(f"🔍 Verifying token: {token[:20]}...")
    
    email = verify_token(token)
    logger.info(f"🔍 Token verification result - Email: {email}")
    
    if email is None:
        logger.warning("❌ Token verification failed")
        raise credentials_exception

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(email)
    logger.info(f"🔍 User lookup result: {user.email if user else 'None'}")
    
    if user is None:
        logger.warning("❌ User not found in database")
        raise credentials_exception
    
    logger.info(f"✅ Authentication successful for user: {user.email}")
    return user

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Dependency to get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_optional_current_user():
    """
    Optional dependency to get current user (returns None if not authenticated)
    """
    async def _get_optional_current_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db = Depends(get_database)
    ) -> Optional[UserInDB]:
        if not credentials:
            return None
            
        try:
            token = credentials.credentials
            email = verify_token(token)
            
            if email is None:
                return None

            auth_service = AuthService(db)
            user = await auth_service.get_user_by_email(email)
            return user
        except:
            return None
    
    return _get_optional_current_user