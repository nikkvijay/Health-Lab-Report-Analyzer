from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from datetime import datetime
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserLogin, UserUpdate, Token, UserResponse, RefreshTokenRequest
from app.core.auth import get_current_active_user, security
from app.database.connection import get_database
from app.models.user import UserInDB

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    db = Depends(get_database)
):
    """
    Register a new user
    """
    import logging
    import re
    logger = logging.getLogger(__name__)
    
    auth_service = AuthService(db)
    
    try:
        # Validate password strength
        if len(user_create.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long for security."
            )
            
        if not re.search(r'[A-Z]', user_create.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter."
            )
            
        if not re.search(r'[a-z]', user_create.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter."
            )
            
        if not re.search(r'\d', user_create.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one number."
            )
        
        # Check if user already exists
        existing_user = await auth_service.get_user_by_email(user_create.email)
        if existing_user:
            logger.warning(f"Registration attempt with existing email: {user_create.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists. Please use a different email or try logging in."
            )
        
        # Validate full name
        if len(user_create.full_name.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide your full name (at least 2 characters)."
            )
        
        user = await auth_service.create_user(user_create)
        logger.info(f"New user registered successfully: {user.email}")
        
        # Auto-create self profile for new user
        try:
            from app.services.family_profile_service import family_profile_service
            from app.models.user import User
            user_obj = User(**user.dict())
            await family_profile_service.create_self_profile(user_obj)
            logger.info(f"Self profile created for new user: {user.email}")
        except Exception as profile_error:
            logger.warning(f"Failed to create self profile for {user.email}: {profile_error}")
            # Don't fail registration if profile creation fails
        
        return UserResponse(**user.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration for {user_create.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration. Please try again or contact support if the problem persists."
        )

@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    db = Depends(get_database)
):
    """
    Login user and return access and refresh tokens
    """
    import logging
    logger = logging.getLogger(__name__)
    
    auth_service = AuthService(db)
    
    try:
        # Check if user exists
        existing_user = await auth_service.get_user_by_email(user_login.email)
        if not existing_user:
            logger.warning(f"Login attempt for non-existent email: {user_login.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No account found with this email address. Please check your email or register for a new account.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if account is active
        if not existing_user.is_active:
            logger.warning(f"Login attempt for inactive account: {user_login.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been deactivated. Please contact support for assistance.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Authenticate user
        user = await auth_service.authenticate_user(user_login)
        if not user:
            logger.warning(f"Invalid password for email: {user_login.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please check your password and try again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        tokens = auth_service.create_tokens(user)
        logger.info(f"Successful login for user: {user.email}")
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login for {user_login.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login. Please try again or contact support if the problem persists."
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db = Depends(get_database)
):
    """
    Refresh access token using refresh token
    """
    import logging
    logger = logging.getLogger(__name__)
    
    auth_service = AuthService(db)
    try:
        tokens = await auth_service.refresh_access_token(refresh_request.refresh_token)
        logger.info("Token refresh successful")
        return tokens
    except HTTPException as e:
        logger.warning(f"Token refresh failed: {e.detail}")
        # Return specific error for invalid refresh tokens to help frontend handle it
        if e.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get current user information
    """
    return UserResponse(**current_user.dict())

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Logout user (client should remove tokens)
    """
    # In a production app, you might want to blacklist the token
    # For now, we'll just return a success message
    return {"message": "Successfully logged out"}

@router.get("/verify-token")
async def verify_token_endpoint(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Verify if the provided token is valid
    """
    return {"valid": True, "user": UserResponse(**current_user.dict())}

@router.get("/debug-auth")
async def debug_auth_endpoint(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Simple debug endpoint to test authentication
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🎯 Debug auth endpoint accessed by: {current_user.email}")
    
    return {
        "message": "Authentication working correctly",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "timestamp": str(datetime.now())
    }

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """
    Update current user's profile information
    """
    auth_service = AuthService(db)
    try:
        updated_user = await auth_service.update_user(current_user.id, user_update)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return UserResponse(**updated_user.dict())
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )