# app/api/v1/endpoints/shared_reports.py
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import FileResponse
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import secrets
import bcrypt
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorCollection

from app.database.connection import get_database
from app.models.user import User
from app.core.auth import get_current_user
from app.services.data_service import DataService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
data_service = DataService()

async def verify_report_ownership(report_id: str, user_id: str):
    """Verify that a user owns a specific report"""
    report = await data_service.get_report(report_id)
    if not report or report.user_id != user_id:
        return None
    return report

# Shared link model
class ShareLink:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', self.generate_id())
        self.report_id = kwargs.get('report_id')
        self.user_id = kwargs.get('user_id')
        self.token = kwargs.get('token', self.generate_token())
        self.access_level = kwargs.get('access_level', 'view')  # view, comment, edit
        self.password_hash = kwargs.get('password_hash')
        self.expires_at = kwargs.get('expires_at')
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.access_count = kwargs.get('access_count', 0)
        self.is_active = kwargs.get('is_active', True)
        self.last_accessed = kwargs.get('last_accessed')

    @staticmethod
    def generate_id():
        return secrets.token_hex(16)
    
    @staticmethod
    def generate_token():
        return secrets.token_urlsafe(32)

    def dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'user_id': self.user_id,
            'token': self.token,
            'access_level': self.access_level,
            'password_hash': self.password_hash,
            'expires_at': self.expires_at,
            'created_at': self.created_at,
            'access_count': self.access_count,
            'is_active': self.is_active,
            'last_accessed': self.last_accessed
        }

async def get_shared_links_collection():
    """Get the shared_links collection"""
    db = await get_database()
    return db.shared_links

@router.post("/reports/{report_id}/share")
async def create_share_link(
    report_id: str,
    share_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create a shareable link for a report"""
    try:
        # Verify user owns the report
        report = await verify_report_ownership(report_id, current_user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        collection = await get_shared_links_collection()
        
        # Create share link
        share_link = ShareLink(
            report_id=report_id,
            user_id=current_user.id,
            access_level=share_data.get('access_level', 'view')
        )

        # Handle password protection
        if share_data.get('password'):
            password_bytes = share_data['password'].encode('utf-8')
            share_link.password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

        # Handle expiration
        expires_in = share_data.get('expires_in')
        if expires_in and expires_in != 'never':
            days_map = {
                '1day': 1,
                '1week': 7,
                '1month': 30,
                '3months': 90
            }
            if expires_in in days_map:
                share_link.expires_at = datetime.utcnow() + timedelta(days=days_map[expires_in])

        # Save to database
        await collection.insert_one(share_link.dict())
        
        # Generate public URL
        share_url = f"/shared/reports/{report_id}?token={share_link.token}"
        
        return {
            "id": share_link.id,
            "url": share_url,
            "token": share_link.token,
            "access_level": share_link.access_level,
            "expires_at": share_link.expires_at.isoformat() if share_link.expires_at else None,
            "created_at": share_link.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating share link: {e}")
        raise HTTPException(status_code=500, detail="Failed to create share link")

@router.get("/shared/reports/{report_id}")
async def get_shared_report(
    report_id: str,
    share_token: Optional[str] = Header(None, alias="Share-Token"),
    token: Optional[str] = None  # Query parameter fallback
):
    """Get a shared report using share token"""
    try:
        # Use token from header or query parameter
        access_token = share_token or token
        if not access_token:
            raise HTTPException(status_code=401, detail="Share token required")

        collection = await get_shared_links_collection()
        
        # Find and validate share link
        share_link_data = await collection.find_one({
            "report_id": report_id,
            "token": access_token,
            "is_active": True
        })
        
        if not share_link_data:
            raise HTTPException(status_code=401, detail="Invalid or expired share link")
        
        share_link = ShareLink(**share_link_data)
        
        # Check expiration
        if share_link.expires_at and share_link.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="Share link has expired")
        
        # Check if password is required
        if share_link.password_hash:
            return {
                "requiresPassword": True,
                "accessLevel": share_link.access_level,
                "expiresAt": share_link.expires_at.isoformat() if share_link.expires_at else None
            }
        
        # Get the actual report
        report = await data_service.get_report(report_id)
        if not report or report.user_id != share_link.user_id:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Update access count
        await collection.update_one(
            {"_id": share_link_data["_id"]},
            {
                "$inc": {"access_count": 1},
                "$set": {"last_accessed": datetime.utcnow()}
            }
        )
        
        # Get owner information (anonymize for privacy)
        owner_name = "Report Owner"  # Could get from user table if needed
        
        return {
            "id": report.id,
            "title": report.filename,
            "uploadDate": report.upload_date.isoformat(),
            "parameters": [
                {
                    "name": param.name,
                    "value": param.value,
                    "unit": param.unit,
                    "status": param.status.value if hasattr(param.status, 'value') else param.status,
                    "reference_range": param.reference_range or "N/A"
                }
                for param in report.parameters
            ],
            "ownerName": owner_name,
            "accessLevel": share_link.access_level,
            "requiresPassword": False,
            "expiresAt": share_link.expires_at.isoformat() if share_link.expires_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shared report: {e}")
        raise HTTPException(status_code=500, detail="Failed to load shared report")

@router.post("/shared/reports/{report_id}/access")
async def verify_shared_report_password(
    report_id: str,
    password_data: Dict[str, str],
    share_token: Optional[str] = Header(None, alias="Share-Token")
):
    """Verify password for password-protected shared report"""
    try:
        if not share_token:
            raise HTTPException(status_code=401, detail="Share token required")
            
        password = password_data.get("password")
        if not password:
            raise HTTPException(status_code=400, detail="Password required")

        collection = await get_shared_links_collection()
        
        # Find share link
        share_link_data = await collection.find_one({
            "report_id": report_id,
            "token": share_token,
            "is_active": True
        })
        
        if not share_link_data:
            raise HTTPException(status_code=401, detail="Invalid share link")
        
        share_link = ShareLink(**share_link_data)
        
        # Check expiration
        if share_link.expires_at and share_link.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="Share link has expired")
        
        # Verify password
        if not share_link.password_hash:
            raise HTTPException(status_code=400, detail="This report is not password protected")
        
        password_bytes = password.encode('utf-8')
        if not bcrypt.checkpw(password_bytes, share_link.password_hash.encode('utf-8')):
            raise HTTPException(status_code=403, detail="Incorrect password")
        
        # Get the report (same as get_shared_report)
        report = await data_service.get_report(report_id)
        if not report or report.user_id != share_link.user_id:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Update access count
        await collection.update_one(
            {"_id": share_link_data["_id"]},
            {
                "$inc": {"access_count": 1},
                "$set": {"last_accessed": datetime.utcnow()}
            }
        )
        
        owner_name = "Report Owner"
        
        return {
            "id": report.id,
            "title": report.filename,
            "uploadDate": report.upload_date.isoformat(),
            "parameters": [
                {
                    "name": param.name,
                    "value": param.value,
                    "unit": param.unit,
                    "status": param.status.value if hasattr(param.status, 'value') else param.status,
                    "reference_range": param.reference_range or "N/A"
                }
                for param in report.parameters
            ],
            "ownerName": owner_name,
            "accessLevel": share_link.access_level,
            "requiresPassword": False,
            "expiresAt": share_link.expires_at.isoformat() if share_link.expires_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify password")

@router.get("/shared/reports/{report_id}/download")
async def download_shared_report(
    report_id: str,
    share_token: Optional[str] = Header(None, alias="Share-Token")
):
    """Download a shared report as PDF"""
    try:
        if not share_token:
            raise HTTPException(status_code=401, detail="Share token required")

        collection = await get_shared_links_collection()
        
        # Validate share link
        share_link_data = await collection.find_one({
            "report_id": report_id,
            "token": share_token,
            "is_active": True
        })
        
        if not share_link_data:
            raise HTTPException(status_code=401, detail="Invalid share link")
        
        share_link = ShareLink(**share_link_data)
        
        # Check expiration
        if share_link.expires_at and share_link.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="Share link has expired")
        
        # Get the report
        report = await data_service.get_report(report_id)
        if not report or report.user_id != share_link.user_id:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Update access count
        await collection.update_one(
            {"_id": share_link_data["_id"]},
            {"$inc": {"access_count": 1}}
        )
        
        # Return the original file if available
        file_path = Path(report.file_path) if report.file_path else None
        if file_path and file_path.exists():
            return FileResponse(
                str(file_path),
                media_type="application/pdf",
                filename=f"{report.filename}"
            )
        else:
            raise HTTPException(status_code=404, detail="Report file not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading shared report: {e}")
        raise HTTPException(status_code=500, detail="Failed to download report")

@router.get("/reports/{report_id}/shares")
async def get_report_shares(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all share links for a report"""
    try:
        # Verify user owns the report
        report = await verify_report_ownership(report_id, current_user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        collection = await get_shared_links_collection()
        
        shares_data = await collection.find({
            "report_id": report_id,
            "user_id": current_user.id
        }).to_list(None)
        
        shares = []
        for share_data in shares_data:
            share_link = ShareLink(**share_data)
            shares.append({
                "id": share_link.id,
                "url": f"/shared/reports/{report_id}?token={share_link.token}",
                "access_level": share_link.access_level,
                "expires_at": share_link.expires_at.isoformat() if share_link.expires_at else None,
                "created_at": share_link.created_at.isoformat(),
                "access_count": share_link.access_count,
                "is_active": share_link.is_active,
                "last_accessed": share_link.last_accessed.isoformat() if share_link.last_accessed else None
            })
        
        return {"shares": shares}
        
    except Exception as e:
        logger.error(f"Error getting report shares: {e}")
        raise HTTPException(status_code=500, detail="Failed to get shares")

@router.delete("/shares/{share_id}")
async def revoke_share_link(
    share_id: str,
    current_user: User = Depends(get_current_user)
):
    """Revoke/delete a share link"""
    try:
        collection = await get_shared_links_collection()
        
        # Verify user owns the share link
        share_data = await collection.find_one({
            "id": share_id,
            "user_id": current_user.id
        })
        
        if not share_data:
            raise HTTPException(status_code=404, detail="Share link not found")
        
        # Deactivate the share link
        await collection.update_one(
            {"id": share_id},
            {"$set": {"is_active": False}}
        )
        
        return {"message": "Share link revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking share link: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke share link")