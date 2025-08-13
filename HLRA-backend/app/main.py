from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints import upload, extraction, reports, stats, trends
from app.database.connection import connect_to_mongo, close_mongo_connection


  # Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

  # Create uploads directory if it doesn't exist
os.makedirs(settings.upload_dir, exist_ok=True)

  # Log configuration info
logger.info(f"🌐 CORS Origins: {settings.allowed_origins}")
logger.info(f"🔗 Public App URL for shared links: {settings.effective_public_app_url}")
logger.info(f"📁 Upload directory: {settings.upload_dir}")
logger.info(f"🔑 JWT expires in: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")

app = FastAPI(
      title="Health API",
      description="Health Lab Report Analyzer API",
      version="1.0.0"
  )

  # Middleware to log incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
      logger.info(f"Incoming request: {request.method} {request.url}")
      response = await call_next(request)
      logger.info(f"Response status: {response.status_code}")
      return response

  # CORS middleware
app.add_middleware(
      CORSMiddleware,
      allow_origins=settings.allowed_origins,
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  # Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

  # Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
      return {
          "message": "Health API",
          "status": "running",
          "version": "1.0.0"
      }

@app.get("/health")
async def health_check():
      return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
      await connect_to_mongo()
      logger.info("MongoDB connected")

@app.on_event("shutdown")
async def shutdown_event():
      await close_mongo_connection()
      logger.info("MongoDB disconnected")

if __name__ == "__main__":
      import uvicorn
      uvicorn.run(
          "app.main:app",
          host=settings.api_host,
          port=settings.api_port,
          reload=settings.debug
      )