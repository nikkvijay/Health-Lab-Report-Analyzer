from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random
from app.models.health_data import LabReport, TrendData, TrendDataPoint, ParameterStatus

# In-memory storage for demo (replace with database in production)
reports_db: Dict[str, LabReport] = {}

class DataService:
    def __init__(self):
        pass

    def save_report(self, report: LabReport) -> LabReport:
        """Save lab report to storage"""
        reports_db[report.id] = report
        return report

    def get_report(self, report_id: str, user_id: str) -> Optional[LabReport]:
        """Get lab report by ID"""
        report = reports_db.get(report_id)
        if report and report.user_id == user_id:
            return report
        return None

    def get_user_reports(self, user_id: str) -> List[LabReport]:
        """Get all reports for a user"""
        return [report for report in reports_db.values() if report.user_id == user_id]

    def update_report(self, report: LabReport) -> LabReport:
        """Update existing report"""
        reports_db[report.id] = report
        return report

    def delete_report(self, report_id: str, user_id: str) -> bool:
        """Delete report"""
        report = reports_db.get(report_id)
        if report and report.user_id == user_id:
            del reports_db[report_id]
            return True
        return False

    def generate_mock_trend_data(self, parameter_name: str, user_id: str) -> TrendData:
        """Generate mock trend data for demonstration"""
        # Generate 6 months of mock data
        data_points = []
        base_date = datetime.utcnow() - timedelta(days=180)
        
        # Base values for different parameters
        base_values = {
            "glucose": 85,
            "cholesterol": 180,
            "hemoglobin": 14.0,
            "blood_pressure": 120,
            "creatinine": 1.0
        }
        
        base_value = base_values.get(parameter_name.lower(), 100)
        
        for i in range(6):
            date = base_date + timedelta(days=30 * i)
            # Add some random variation
            variation = random.uniform(-0.1, 0.1)
            value = base_value * (1 + variation)
            
            # Determine status based on value
            if parameter_name.lower() == "glucose":
                if value < 70:
                    status = ParameterStatus.LOW
                elif value > 100:
                    status = ParameterStatus.HIGH
                else:
                    status = ParameterStatus.NORMAL
            else:
                status = ParameterStatus.NORMAL
            
            data_points.append(TrendDataPoint(
                date=date,
                value=round(value, 1),
                status=status
            ))
        
        # Determine trend direction
        if len(data_points) >= 2:
            first_value = float(data_points[0].value)
            last_value = float(data_points[-1].value)
            if last_value > first_value * 1.05:
                trend_direction = "improving" if parameter_name.lower() in ["hemoglobin"] else "declining"
            elif last_value < first_value * 0.95:
                trend_direction = "declining" if parameter_name.lower() in ["hemoglobin"] else "improving"
            else:
                trend_direction = "stable"
        else:
            trend_direction = "stable"
        
        return TrendData(
            parameter_name=parameter_name,
            data_points=data_points,
            trend_direction=trend_direction
        )

data_service = DataService()