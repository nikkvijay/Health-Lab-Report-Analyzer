from fastapi import APIRouter
from app.api.v1.endpoints import upload, extraction, reports, stats, trends, auth, family_profiles, notifications, shared_reports

api_router = APIRouter()

# Authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Upload routes
api_router.include_router(upload.router, tags=["upload"])

# Extraction routes
api_router.include_router(extraction.router, prefix="/extract", tags=["extraction"])

# Reports routes
api_router.include_router(reports.router, tags=["reports"])

# Stats routes
api_router.include_router(stats.router, tags=["stats"])

# Trends routes
api_router.include_router(trends.router, tags=["trends"])

# Family profiles routes
api_router.include_router(family_profiles.router, tags=["family-profiles"])

# Notifications routes
api_router.include_router(notifications.router, tags=["notifications"])

# Shared reports routes
api_router.include_router(shared_reports.router, prefix="/sharing", tags=["shared-reports"])