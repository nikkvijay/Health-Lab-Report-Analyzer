# app/services/auth_service.py
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
from app.core.config import settings
from app.core.security import security_service
from app.models.auth import User, UserInDB, AuthProvider
from app.core.exceptions import AuthenticationError
import uuid
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for demo (replace with database in production)
users_db: Dict[str, UserInDB] = {}

class AuthService:
    def __init__(self):
        self.security = security_service

    async def create_user(self, email: str, password: str, name: str, provider: AuthProvider = AuthProvider.EMAIL) -> User:
        """Create a new user"""
        logger.info(f"Creating user: {email}")
        if email in users_db:
            logger.error(f"Email already registered: {email}")
            raise AuthenticationError("Email already registered")
        
        hashed_password = self.security.get_password_hash(password) if password else ""
        user_id = str(uuid.uuid4())
        
        user = UserInDB(
            id=user_id,
            email=email,
            name=name,
            hashed_password=hashed_password,
            provider=provider,
            created_at=datetime.utcnow(),
            is_active=True
        )
        
        users_db[email] = user
        logger.info(f"User created successfully: {email}")
        return User(**user.dict())

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        logger.info(f"Authenticating user: {email}")
        user = users_db.get(email)
        if not user:
            logger.warning(f"User not found: {email}")
            return None
        if not self.security.verify_password(password, user.hashed_password):
            logger.warning(f"Password verification failed for: {email}")
            return None
        logger.info(f"User authenticated successfully: {email}")
        return User(**user.dict())

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        logger.info(f"Fetching user by email: {email}")
        user = users_db.get(email)
        if user:
            return User(**user.dict())
        logger.warning(f"User not found: {email}")
        return None

    async def create_access_token(self, user: User) -> str:
        """Create access token for user"""
        logger.info(f"Creating access token for: {user.email}")
        token_data = {"sub": user.email}
        token = self.security.create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        logger.info(f"Access token created for: {user.email}")
        return token

    async def verify_google_token(self, code: str) -> Dict[str, Any]:
        """Verify Google OAuth token and get user info"""
        logger.info("Verifying Google OAuth token")
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri,
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            if token_response.status_code != 200:
                logger.error(f"Failed to exchange code for token: {token_response.text}")
                raise AuthenticationError(f"Failed to exchange code for token: {token_response.text}")
            token_json = token_response.json()
        
        try:
            id_info = id_token.verify_oauth2_token(
                token_json["id_token"], 
                requests.Request(), 
                settings.google_client_id
            )
            logger.info(f"Google token verified for email: {id_info['email']}")
            return {
                "email": id_info["email"],
                "name": id_info["name"],
                "avatar": id_info.get("picture")
            }
        except ValueError as e:
            logger.error(f"Invalid Google token: {str(e)}")
            raise AuthenticationError(f"Invalid token: {str(e)}")

    async def verify_github_token(self, code: str) -> Dict[str, Any]:
        """Verify GitHub OAuth token and get user info"""
        logger.info("Verifying GitHub OAuth token")
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "client_id": settings.github_client_id,
            "client_secret": settings.github_client_secret,
            "code": code,
        }
        
        headers = {"Accept": "application/json"}
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data, headers=headers)
            if token_response.status_code != 200:
                logger.error(f"Failed to exchange code for token: {token_response.text}")
                raise AuthenticationError(f"Failed to exchange code for token: {token_response.text}")
            
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            if not access_token:
                logger.error("No access token received from GitHub")
                raise AuthenticationError("No access token received")
            
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {access_token}"}
            )
            
            if user_response.status_code != 200:
                logger.error(f"Failed to get user info: {user_response.text}")
                raise AuthenticationError(f"Failed to get user info from GitHub: {user_response.text}")
                
            user_data = user_response.json()
            
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}"}
            )
            
            primary_email = user_data.get("email")
            if not primary_email and email_response.status_code == 200:
                emails = email_response.json()
                for email_obj in emails:
                    if email_obj.get("primary", False):
                        primary_email = email_obj["email"]
                        break
            
            logger.info(f"GitHub token verified for email: {primary_email}")
            return {
                "email": primary_email,
                "name": user_data.get("name") or user_data.get("login"),
                "avatar": user_data.get("avatar_url")
            }

    async def get_or_create_oauth_user(self, user_data: Dict[str, Any], provider: AuthProvider) -> User:
        """Get existing OAuth user or create new one"""
        email = user_data["email"]
        logger.info(f"Checking/creating OAuth user: {email} ({provider})")
        existing_user = await self.get_user_by_email(email)
        
        if existing_user:
            logger.info(f"Existing OAuth user found: {email}")
            return existing_user
        
        logger.info(f"Creating new OAuth user: {email}")
        return await self.create_user(
            email=email,
            password="",  # No password for OAuth users
            name=user_data["name"],
            provider=provider
        )

auth_service = AuthService()