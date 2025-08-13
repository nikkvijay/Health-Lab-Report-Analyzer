 # app/models/health_data.py
from datetime import datetime
from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, validator
import uuid
from app.utils.date_utils import to_utc_datetime, serialize_datetime

class FileStatus(str, Enum):
      UPLOADING = "uploading"
      PROCESSING = "processing"
      COMPLETED = "completed"
      FAILED = "failed"

class ParameterStatus(str, Enum):
      NORMAL = "normal"
      HIGH = "high"
      LOW = "low"
      CRITICAL = "critical"

class ParameterCategory(str, Enum):
      BLOOD = "blood"
      URINE = "urine"
      LIPID = "lipid"
      LIVER = "liver"
      KIDNEY = "kidney"
      HORMONE = "hormone"
      VITAMIN = "vitamin"

class HealthParameter(BaseModel):
      id: str = None
      name: str
      value: Union[float, str]
      unit: Optional[str] = None
      reference_range: Optional[str] = None
      status: ParameterStatus
      category: Optional[ParameterCategory] = None
      extracted_text: Optional[str] = None

      def __init__(self, **data):
          if 'id' not in data or data['id'] is None:
              data['id'] = str(uuid.uuid4())
          super().__init__(**data)

class LabReport(BaseModel):
      id: str = None
      user_id: str  # Owner of the report
      profile_id: Optional[str] = None  # Family profile associated with this report
      filename: str
      original_filename: str
      file_path: str
      upload_date: datetime
      processing_status: FileStatus
      parameters: List[HealthParameter] = []
      raw_text: Optional[str] = None
      error_message: Optional[str] = None
      file_size: int
      file_type: str
      is_starred: bool = False

      def __init__(self, **data):
          if 'id' not in data or data['id'] is None:
              data['id'] = str(uuid.uuid4())
          super().__init__(**data)

class TrendDataPoint(BaseModel):
      date: datetime
      value: Union[float, str]
      status: ParameterStatus

class TrendData(BaseModel):
      parameter_name: str
      data_points: List[TrendDataPoint]
      trend_direction: Optional[str] = None  # "improving", "declining", "stable"