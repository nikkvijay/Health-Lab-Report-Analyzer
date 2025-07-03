from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from app.models.health_data import TrendData
from app.models.auth import User
from app.services.data_service import data_service
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/trends/{parameter_name}", response_model=TrendData)
async def get_parameter_trend(
    parameter_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get trend data for specific parameter"""
    trend_data = data_service.generate_mock_trend_data(parameter_name, current_user.id)
    return trend_data

@router.get("/trends/summary", response_model=List[TrendData])
async def get_trends_summary(
    current_user: User = Depends(get_current_active_user)
):
    """Get trend summary for key parameters"""
    key_parameters = ["glucose", "cholesterol", "hemoglobin"]
    trends = []
    
    for param in key_parameters:
        trend_data = data_service.generate_mock_trend_data(param, current_user.id)
        trends.append(trend_data)
    
    return trends

@router.get("/trends")
async def get_available_trends(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available trend parameters"""
    return {
        "available_parameters": [
            "glucose",
            "cholesterol", 
            "hemoglobin",
            "blood_pressure",
            "creatinine"
        ]
    }