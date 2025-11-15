from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os

class Settings(BaseSettings):
      # API Configuration
      api_host: str = Field(default="0.0.0.0", env="API_HOST")
      api_port: int = Field(default=8000, env="API_PORT")
      debug: bool = Field(default=False, env="DEBUG")

      # CORS Configuration
      cors_origins: str = Field(
          default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
          env="CORS_ORIGINS"
      )

      # File Upload Configuration
      max_file_size: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
      upload_dir: str = Field(default="uploads", env="UPLOAD_DIR")
      allowed_extensions: List[str] = [".pdf", ".jpg", ".jpeg", ".png"]

      # OCR Configuration
      tesseract_path: str = ""

      # MongoDB Configuration
      mongodb_url: str = Field(env="MONGODB_URL")
      mongodb_name: str = Field(default="hlra_db", env="MONGODB_NAME")

      # JWT Configuration
      SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
      ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
      REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
      
      # Public App Configuration (for shared links)
      public_app_url: str = Field(default="", env="PUBLIC_APP_URL")

      # Gemini AI Configuration
      gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")

      @property
      def allowed_origins(self) -> List[str]:
          """Parse CORS origins from environment variable"""
          if self.cors_origins:
              return [origin.strip() for origin in self.cors_origins.split(",")]
          return ["http://localhost:3000", "http://localhost:5173"]

      @property
      def effective_public_app_url(self) -> str:
          """Get the effective public app URL with intelligent fallback"""
          if self.public_app_url:
              return self.public_app_url.rstrip('/')
          
          # Try to derive from first CORS origin that looks like a frontend URL
          origins = self.allowed_origins
          for origin in origins:
              # Skip localhost/127.0.0.1 in production-like scenarios
              # Prefer HTTPS origins over HTTP
              if origin.startswith('https://') and 'localhost' not in origin and '127.0.0.1' not in origin:
                  return origin.rstrip('/')
          
          # Fall back to first origin
          if origins:
              return origins[0].rstrip('/')
          
          # Ultimate fallback - but this should never be used in production
          return "http://localhost:3000"

      class Config:
          env_file = ".env"
          case_sensitive = False

settings = Settings()