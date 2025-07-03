# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from app.core.config import settings
from app.api.endpoints import auth, upload, extraction, reports, trends

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="Korai Health API",
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
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(extraction.router, prefix="/api", tags=["extraction"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(trends.router, prefix="/api", tags=["trends"])

@app.get("/")
async def root():
    return {
        "message": "Korai Health API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )