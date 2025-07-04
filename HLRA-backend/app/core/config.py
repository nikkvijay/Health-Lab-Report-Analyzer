# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # JWT Configuration
    secret_key: str = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
    jwt_secret: str = os.getenv("JWT_SECRET", "fallback-jwt-secret-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OAuth Configuration
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI")
    
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = os.getenv("GITHUB_REDIRECT_URI")
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = int(os.getenv("PORT", 8000))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # File Upload Configuration
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = os.getenv("UPLOAD_DIR", "/tmp/uploads")
    allowed_extensions: List[str] = [".pdf", ".jpg", ".jpeg", ".png"]
    
    # CORS Configuration
    def get_allowed_origins(self) -> List[str]:
        cors_origins = os.getenv("CORS_ORIGINS", "")
        if cors_origins:
            return [origin.strip() for origin in cors_origins.split(",")]
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://health-lab-report-analyzer.vercel.app"
        ]
    
    @property
    def allowed_origins(self) -> List[str]:
        return self.get_allowed_origins()
    
    # OCR Configuration
    tesseract_path: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()