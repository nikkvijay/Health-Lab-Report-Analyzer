# app/api/endpoints/auth.py
import logging
from fastapi import APIRouter, HTTPException, Depends, status, Request, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer
from app.models.auth import UserCreate, UserLogin, Token, User
from app.services.auth_service import auth_service
from app.core.exceptions import AuthenticationError
from app.api.deps import get_current_user, get_current_active_user

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/test-signup")
async def test_signup():
    """Create a test user for debugging"""
    try:
        test_user = await auth_service.create_user(
            email="test@example.com",
            password="password123",
            name="Test User"
        )
        logger.info(f"Test user created: {test_user.email}")
        return {
            "message": "Test user created successfully",
            "email": "test@example.com",
            "password": "password123",
            "user_id": test_user.id
        }
    except Exception as e:
        logger.error(f"Test signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/debug-login")
async def debug_login(request: Request):
    """Debug endpoint to test frontend-backend communication"""
    try:
        body = await request.body()
        headers = dict(request.headers)
        logger.info(f"Debug login - Headers: {headers}")
        logger.info(f"Debug login - Body: {body.decode() if body else 'No body'}")
        return {
            "status": "received",
            "message": "Backend is receiving requests",
            "body_received": body.decode() if body else "No body",
            "headers": headers
        }
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, request: Request):
    """Login with email and password"""
    logger.info(f"=== LOGIN ATTEMPT ===")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request body: {user_data.dict()}")
    
    try:
        user = await auth_service.authenticate_user(user_data.email, user_data.password)
        if not user:
            logger.warning(f"Authentication failed for: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Authentication successful for: {user.email}")
        access_token = await auth_service.create_access_token(user)
        
        response_data = Token(
            access_token=access_token,
            token_type="bearer",
            user=user.dict() if hasattr(user, 'dict') else user
        )
        
        logger.info(f"Returning token for user: {user.email}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during login: {str(e)}"
        )

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        logger.info(f"Signup attempt for email: {user_data.email}")
        user = await auth_service.create_user(
            email=user_data.email,
            password=user_data.password,
            name=user_data.name
        )
        access_token = await auth_service.create_access_token(user)
        logger.info(f"Signup successful for user: {user.email}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user.dict() if hasattr(user, 'dict') else user
        )
    except AuthenticationError as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/google")
async def google_login():
    """Initiate Google OAuth login"""
    from app.core.config import settings
    logger.info(f"Google OAuth redirect URI: {settings.google_redirect_uri}")
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={settings.google_redirect_uri}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline"
    )
    return {"auth_url": google_auth_url}

@router.get("/google/callback", response_model=Token)
async def google_callback(code: str = Query(...)):
    """Handle Google OAuth callback"""
    try:
        logger.info(f"Google callback received with code: {code}")
        user_data = await auth_service.verify_google_token(code)
        user = await auth_service.get_or_create_oauth_user(user_data, "google")
        access_token = await auth_service.create_access_token(user)
        logger.info(f"Google OAuth successful for user: {user.email}")
        # Redirect to frontend with access token and provider
        frontend_url = f"http://localhost:5173/auth/callback?code={access_token}&provider=google"
        return RedirectResponse(url=frontend_url)
    except AuthenticationError as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/github")
async def github_login():
    """Initiate GitHub OAuth login"""
    from app.core.config import settings
    logger.info(f"GitHub OAuth redirect URI: {settings.github_redirect_uri}")
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.github_client_id}&"
        f"redirect_uri={settings.github_redirect_uri}&"
        f"scope=user:email&"
        f"response_type=code"
    )
    return {"auth_url": github_auth_url}

@router.get("/github/callback", response_model=Token)
async def github_callback(code: str = Query(...)):
    """Handle GitHub OAuth callback"""
    try:
        logger.info(f"GitHub callback received with code: {code}")
        user_data = await auth_service.verify_github_token(code)
        user = await auth_service.get_or_create_oauth_user(user_data, "github")
        access_token = await auth_service.create_access_token(user)
        logger.info(f"GitHub OAuth successful for user: {user.email}")
        # Redirect to frontend with access token and provider
        frontend_url = f"http://localhost:5173/auth/callback?code={access_token}&provider=github"
        return RedirectResponse(url=frontend_url)
    except AuthenticationError as e:
        logger.error(f"GitHub OAuth error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    try:
        logger.info(f"Fetching user info for: {current_user.email}")
        return current_user
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user information"
        )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    try:
        logger.info(f"User logging out: {current_user.email}")
        # Add any cleanup needed (token invalidation, etc.)
        return {"status": "success", "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )