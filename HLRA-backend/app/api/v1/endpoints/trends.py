from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.data_service import data_service
from app.schemas.request import TrendExportRequest
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/trends/{parameter}")
async def get_trend_data(
      parameter: str,
      date_range: Optional[str] = Query(default="3months"),
      user_id: Optional[str] = Query(default=None)
  ):
      """Get trend data for a specific parameter"""
      try:
          # Get trend data from service
          trend_data = await data_service.get_trend_data(parameter, user_id)

          return {
              "parameter_name": parameter,
              "date_range": date_range,
              "chart_data": trend_data.data_points,
              "trend_direction": trend_data.trend_direction,
              "success": True
          }

      except Exception as e:
          logger.error(f"Error getting trend data for {parameter}: {e}")
          return {
              "parameter_name": parameter,
              "date_range": date_range,
              "chart_data": [],
              "trend_direction": "stable",
              "success": False,
              "error": str(e)
          }

@router.get("/trends/parameters")
async def get_available_parameters():
      """Get list of available parameters for trending"""
      try:
          # For now, return static list - you can make this dynamic later
          parameters = [
              {"name": "glucose", "display_name": "Glucose", "unit": "mg/dL"},
              {"name": "cholesterol", "display_name": "Total Cholesterol", "unit": "mg/dL"},
              {"name": "hdl", "display_name": "HDL Cholesterol", "unit": "mg/dL"},
              {"name": "ldl", "display_name": "LDL Cholesterol", "unit": "mg/dL"},
              {"name": "triglycerides", "display_name": "Triglycerides", "unit": "mg/dL"},
              {"name": "hemoglobin", "display_name": "Hemoglobin", "unit": "g/dL"},
          ]

          return {
              "parameters": parameters,
              "success": True
          }

      except Exception as e:
          logger.error(f"Error getting available parameters: {e}")
          return {
              "parameters": [],
              "success": False,
              "error": str(e)
          }

@router.post("/trends/export")
async def export_trend_data(export_request: TrendExportRequest):
      """Export trend data for multiple parameters"""
      try:
          logger.info(f"Export request: parameters={export_request.parameters}, date_range={export_request.date_range}")
          
          # Placeholder for export functionality
          return {
              "message": "Export functionality coming soon",
              "parameters": export_request.parameters,
              "date_range": export_request.date_range,
              "success": True
          }

      except Exception as e:
          logger.error(f"Error exporting trend data: {e}")
          return {
              "success": False,
              "error": str(e)
          }