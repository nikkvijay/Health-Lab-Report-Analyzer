from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime

class FileUploadRequest(BaseModel):
      description: Optional[str] = None

class UpdateReportRequest(BaseModel):
      status: Optional[str] = Field(None, pattern="^(pending|processing|completed|failed)$")
      notes: Optional[str] = None

class TrendDataRequest(BaseModel):
      parameter_name: str = Field(..., min_length=1)
      start_date: Optional[datetime] = None
      end_date: Optional[datetime] = None
      user_id: Optional[str] = None

      @validator('parameter_name')
      def validate_parameter_name(cls, v):
          allowed_params = ['glucose', 'cholesterol', 'hemoglobin', 'blood_pressure']
          if v.lower() not in allowed_params:
              raise ValueError(f'Parameter must be one of: {allowed_params}')
          return v

class TrendExportRequest(BaseModel):
      parameters: List[str] = Field(..., min_items=1)
      date_range: str = Field(..., min_length=1)