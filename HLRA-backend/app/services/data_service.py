from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random
from bson import ObjectId
from app.models.health_data import LabReport, TrendData, TrendDataPoint, ParameterStatus,HealthParameter,FileStatus
from app.database.connection import get_reports_collection
import logging

logger = logging.getLogger(__name__)

class DataService:
      def __init__(self):
          pass

      async def save_report(self, report: LabReport) -> LabReport:
          """Save lab report to MongoDB"""
          try:
              collection = await get_reports_collection()

              # Convert to MongoDB document
              report_doc = {
                  "user_id": report.user_id,
                  "profile_id": report.profile_id,
                  "filename": report.filename,
                  "original_filename": report.original_filename,
                  "file_path": report.file_path,
                  "file_type": report.file_type,
                  "file_size": report.file_size,
                  "upload_date": report.upload_date,
                  "parameters": [param.dict() for param in report.parameters],
                  "processing_status": report.processing_status.value,
                  "raw_text": report.raw_text,
                  "error_message": report.error_message,
                  "is_starred": report.is_starred,
                  "created_at": datetime.utcnow(),
                  "updated_at": datetime.utcnow()
              }

              # Insert into MongoDB
              result = await collection.insert_one(report_doc)
              report.id = str(result.inserted_id)

              logger.info(f"Report saved with ID: {report.id}")
              return report

          except Exception as e:
              logger.error(f"Error saving report: {e}")
              raise

      async def get_report(self, report_id: str) -> Optional[LabReport]:
          """Get lab report by ID from MongoDB"""
          try:
              collection = await get_reports_collection()

              # Find document by ObjectId
              document = await collection.find_one({"_id": ObjectId(report_id)})

              if not document:
                  return None

              # Convert MongoDB document to LabReport
              return self._document_to_lab_report(document)

          except Exception as e:
              logger.error(f"Error getting report {report_id}: {e}")
              return None

      async def get_all_reports(self) -> List[LabReport]:
          """Get all reports from MongoDB"""
          try:
              collection = await get_reports_collection()

              # Find all documents
              cursor = collection.find({})
              documents = await cursor.to_list(length=None)

              # Convert all documents to LabReport objects
              reports = []
              for doc in documents:
                  report = self._document_to_lab_report(doc)
                  if report:
                      reports.append(report)

              return reports

          except Exception as e:
              logger.error(f"Error getting all reports: {e}")
              return []

      async def get_reports_by_user_and_profile(self, user_id: str, profile_id: Optional[str] = None) -> List[LabReport]:
          """Get reports for a specific user and optionally filter by profile"""
          try:
              collection = await get_reports_collection()

              # Build query
              query = {"user_id": user_id}
              if profile_id:
                  query["profile_id"] = profile_id

              # Find documents matching the query
              cursor = collection.find(query).sort("upload_date", -1)  # Sort by newest first
              documents = await cursor.to_list(length=None)

              # Convert all documents to LabReport objects
              reports = []
              for doc in documents:
                  report = self._document_to_lab_report(doc)
                  if report:
                      reports.append(report)

              return reports

          except Exception as e:
              logger.error(f"Error getting reports for user {user_id}, profile {profile_id}: {e}")
              return []

      async def get_starred_reports_by_user_and_profile(self, user_id: str, profile_id: Optional[str] = None) -> List[LabReport]:
          """Get starred reports for a specific user and optionally filter by profile"""
          try:
              collection = await get_reports_collection()

              # Build query
              query = {"user_id": user_id, "is_starred": True}
              if profile_id:
                  query["profile_id"] = profile_id

              # Find starred documents matching the query
              cursor = collection.find(query).sort("upload_date", -1)
              documents = await cursor.to_list(length=None)

              # Convert all documents to LabReport objects
              starred_reports = []
              for doc in documents:
                  report = self._document_to_lab_report(doc)
                  if report:
                      starred_reports.append(report)

              return starred_reports

          except Exception as e:
              logger.error(f"Error getting starred reports for user {user_id}, profile {profile_id}: {e}")
              return []

      async def update_report(self, report: LabReport) -> LabReport:
          """Update existing report in MongoDB"""
          try:
              collection = await get_reports_collection()

              update_data = {
                  "filename": report.filename,
                  "original_filename": report.original_filename,
                  "file_path": report.file_path,
                  "file_type": report.file_type,
                  "file_size": report.file_size,
                  "upload_date": report.upload_date,
                  "parameters": [param.dict() for param in report.parameters],
                  "processing_status": report.processing_status.value,
                  "raw_text": report.raw_text,
                  "error_message": report.error_message,
                  "is_starred": report.is_starred,
                  "updated_at": datetime.utcnow()
              }

              # Update document
              result = await collection.update_one(
                  {"_id": ObjectId(report.id)},
                  {"$set": update_data}
              )

              if result.matched_count == 0:
                  logger.warning(f"No report found with ID: {report.id}")
                  return None

              logger.info(f"Report updated: {report.id}")
              return report

          except Exception as e:
              logger.error(f"Error updating report {report.id}: {e}")
              raise

      async def delete_report(self, report_id: str) -> bool:
          """Delete report from MongoDB"""
          try:
              collection = await get_reports_collection()

              # Delete document
              result = await collection.delete_one({"_id": ObjectId(report_id)})

              if result.deleted_count == 0:
                  logger.warning(f"No report found with ID: {report_id}")
                  return False

              logger.info(f"Report deleted: {report_id}")
              return True

          except Exception as e:
              logger.error(f"Error deleting report {report_id}: {e}")
              return False

      def _document_to_lab_report(self, document: dict) -> Optional[LabReport]:
          """Convert MongoDB document to LabReport object"""
          try:
              return LabReport(
                  id=str(document["_id"]),
                  user_id=document.get("user_id", ""),
                  profile_id=document.get("profile_id"),
                  filename=document.get("filename", ""),
                  original_filename=document.get("original_filename", ""),
                  file_path=document.get("file_path", ""),
                  file_type=document.get("file_type", "unknown"),
                  file_size=document.get("file_size", 0),
                  upload_date=document.get("upload_date", datetime.utcnow()),
                  parameters=[HealthParameter(**param) for param in document.get("parameters", [])],
                  processing_status=FileStatus(document.get("processing_status", "pending")),
                  raw_text=document.get("raw_text"),
                  error_message=document.get("error_message"),
                  is_starred=document.get("is_starred", False)
              )
          except Exception as e:
              logger.error(f"Error converting document to LabReport: {e}")
              return None

      async def get_trend_data(self, parameter_name: str, user_id: str = None) -> TrendData:
          """Get actual trend data from MongoDB instead of generating mock data"""
          try:
              collection = await get_reports_collection()

              # Query for completed reports with extracted data
              query = {
                  "status": "completed",
                  "extracted_data": {"$exists": True, "$ne": None}
              }

              if user_id:
                  query["user_id"] = user_id

              # Find reports and sort by date
              cursor = collection.find(query).sort("created_at", 1)
              documents = await cursor.to_list(length=None)

              data_points = []
              for doc in documents:
                  extracted_data = doc.get("extracted_data", {})
                  parameters = extracted_data.get("parameters", [])

                  # Look for the specific parameter
                  for param in parameters:
                      if param.get("name", "").lower() == parameter_name.lower():
                          value = param.get("value")
                          if value is not None:
                              # Determine status based on value and reference ranges
                              status = self._determine_parameter_status(parameter_name, value)

                              data_points.append(TrendDataPoint(
                                  date=doc["created_at"],
                                  value=float(value),
                                  status=status
                              ))

              # If no data found, return empty trend data
              if not data_points:
                  return TrendData(
                      parameter_name=parameter_name,
                      data_points=[],
                      trend_direction="stable"
                  )

              # Determine trend direction
              trend_direction = self._calculate_trend_direction(data_points, parameter_name)

              return TrendData(
                  parameter_name=parameter_name,
                  data_points=data_points,
                  trend_direction=trend_direction
              )

          except Exception as e:
              logger.error(f"Error getting trend data for {parameter_name}: {e}")
              # Return empty trend data on error
              return TrendData(
                  parameter_name=parameter_name,
                  data_points=[],
                  trend_direction="stable"
              )

      def _determine_parameter_status(self, parameter_name: str, value: float) -> ParameterStatus:
          """Determine parameter status based on reference ranges"""
          # This should come from database eventually, but for now use hardcoded ranges
          reference_ranges = {
              "glucose": {"min": 70, "max": 100},
              "cholesterol": {"min": 0, "max": 200},
              "hemoglobin": {"min": 12.0, "max": 17.0},
              "blood_pressure": {"min": 90, "max": 140},
              "creatinine": {"min": 0.6, "max": 1.2}
          }

          param_range = reference_ranges.get(parameter_name.lower())
          if not param_range:
              return ParameterStatus.NORMAL

          if value < param_range["min"]:
              return ParameterStatus.LOW
          elif value > param_range["max"]:
              return ParameterStatus.HIGH
          else:
              return ParameterStatus.NORMAL

      def _calculate_trend_direction(self, data_points: List[TrendDataPoint], parameter_name: str) -> str:
          """Calculate trend direction from data points"""
          if len(data_points) < 2:
              return "stable"

          first_value = float(data_points[0].value)
          last_value = float(data_points[-1].value)

          if last_value > first_value * 1.05:
              # For parameters like hemoglobin, higher is better
              return "improving" if parameter_name.lower() in ["hemoglobin"] else "declining"
          elif last_value < first_value * 0.95:
              return "declining" if parameter_name.lower() in ["hemoglobin"] else "improving"
          else:
              return "stable"

      async def update_report_star(self, report_id: str, is_starred: bool) -> bool:
          """Update the star status of a specific report"""
          try:
              collection = await get_reports_collection()
              
              # Update the is_starred field
              result = await collection.update_one(
                  {"_id": ObjectId(report_id)},
                  {"$set": {"is_starred": is_starred, "updated_at": datetime.utcnow()}}
              )
              
              if result.matched_count == 0:
                  logger.warning(f"No report found with ID: {report_id}")
                  return False
                  
              logger.info(f"Report {report_id} star status updated to: {is_starred}")
              return True
              
          except Exception as e:
              logger.error(f"Error updating star status for report {report_id}: {e}")
              return False

      async def get_starred_reports(self) -> List[LabReport]:
          """Get all starred reports from MongoDB"""
          try:
              collection = await get_reports_collection()
              
              # Find all starred reports
              cursor = collection.find({"is_starred": True})
              documents = await cursor.to_list(length=None)
              
              # Convert all documents to LabReport objects
              starred_reports = []
              for doc in documents:
                  report = self._document_to_lab_report(doc)
                  if report:
                      starred_reports.append(report)
                      
              return starred_reports
              
          except Exception as e:
              logger.error(f"Error getting starred reports: {e}")
              return []

  # Create singleton instance
data_service = DataService()