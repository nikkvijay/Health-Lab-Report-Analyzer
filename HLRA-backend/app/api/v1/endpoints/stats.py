# app/api/v1/endpoints/stats.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.services.data_service import data_service
from app.models.user import User
from app.core.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics for the current user"""
    try:
        # Get reports for the current user only
        reports = await data_service.get_reports_by_user_and_profile(user_id=current_user.id)
        if not reports:
            reports = []
        
        # Calculate total reports
        total_reports = len(reports)
        
        # Calculate this month reports
        current_date = datetime.now()
        start_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        this_month_reports = 0
        failed_reports = 0
        
        for report in reports:
            # Check if report is from this month
            if report.upload_date and report.upload_date >= start_of_month:
                this_month_reports += 1
            
            # Check if report failed
            if report.processing_status.value == "failed":
                failed_reports += 1
        
        logger.info(f"Dashboard stats for user {current_user.id}: total={total_reports}, this_month={this_month_reports}, failed={failed_reports}")
        
        return {
            "total_reports": total_reports,
            "this_month": this_month_reports,
            "avg_processing": "2.4s",
            "health_alerts": failed_reports,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats for user {current_user.id}: {e}")
        return {
            "total_reports": 0,
            "this_month": 0,
            "avg_processing": "0s",
            "health_alerts": 0,
            "success": False
        }

@router.get("/stats/trends")
async def get_trends_stats(current_user: User = Depends(get_current_user)):
    """Get trending statistics for the current user"""
    try:
        reports = await data_service.get_reports_by_user_and_profile(user_id=current_user.id)
        if not reports:
            return {"trends": []}
        
        # Calculate parameter trends
        parameter_counts = {}
        for report in reports:
            for param in report.parameters:
                param_name = param.name
                if param_name not in parameter_counts:
                    parameter_counts[param_name] = {"normal": 0, "high": 0, "low": 0, "critical": 0}
                parameter_counts[param_name][param.status.value] += 1
        
        trends = []
        for param_name, counts in parameter_counts.items():
            total = sum(counts.values())
            trends.append({
                "parameter": param_name,
                "total_tests": total,
                "normal_percentage": round((counts["normal"] / total) * 100, 1) if total > 0 else 0,
                "abnormal_count": counts["high"] + counts["low"] + counts["critical"]
            })
        
        return {"trends": trends}
        
    except Exception as e:
        logger.error(f"Error getting trends stats for user {current_user.id}: {e}")
        return {"trends": []}

@router.get("/stats/parameters")
async def get_parameter_stats(current_user: User = Depends(get_current_user)):
    """Get parameter statistics for the current user"""
    try:
        reports = await data_service.get_reports_by_user_and_profile(user_id=current_user.id)
        if not reports:
            return {"parameters": []}
        
        # Collect all parameters with their values
        parameter_data = {}
        for report in reports:
            for param in report.parameters:
                param_name = param.name
                if param_name not in parameter_data:
                    parameter_data[param_name] = {
                        "name": param_name,
                        "unit": param.unit,
                        "category": param.category.value if param.category else "unknown",
                        "values": [],
                        "statuses": []
                    }
                
                # Try to convert value to float for statistics
                try:
                    if isinstance(param.value, (int, float)):
                        parameter_data[param_name]["values"].append(float(param.value))
                    elif isinstance(param.value, str) and param.value.replace('.', '').isdigit():
                        parameter_data[param_name]["values"].append(float(param.value))
                except (ValueError, TypeError):
                    pass
                
                parameter_data[param_name]["statuses"].append(param.status.value)
        
        # Calculate statistics for each parameter
        parameters = []
        for param_name, data in parameter_data.items():
            values = data["values"]
            statuses = data["statuses"]
            
            stats = {
                "name": param_name,
                "unit": data["unit"],
                "category": data["category"],
                "total_tests": len(statuses),
                "normal_count": statuses.count("normal"),
                "high_count": statuses.count("high"),
                "low_count": statuses.count("low"),
                "critical_count": statuses.count("critical")
            }
            
            if values:
                stats.update({
                    "avg_value": round(sum(values) / len(values), 2),
                    "min_value": min(values),
                    "max_value": max(values)
                })
            
            parameters.append(stats)
        
        return {"parameters": parameters}
        
    except Exception as e:
        logger.error(f"Error getting parameter stats for user {current_user.id}: {e}")
        return {"parameters": []}