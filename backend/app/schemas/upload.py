from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

class UploadedImageBase(BaseModel):
    survey_id: Optional[int] = None
    monitoring_site_id: Optional[int] = None
    filename: str
    filepath: str
    status: Optional[str] = "Pending Analysis"

class UploadedImageCreate(UploadedImageBase):
    pass

from typing import List, Any

class UploadedImageOut(UploadedImageBase):
    id: int
    uploader_id: Optional[int] = None
    uploaded_at: datetime
    created_at: Optional[datetime] = None
    detections: Optional[List[Any]] = []
    ai_summary: Optional[str] = None
    image_quality: Optional[dict] = None
    biodiversity_metrics: Optional[dict] = None
    monitoring_report: Optional[dict] = None
    ecosystem_health_score: Optional[dict] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.replace(tzinfo=timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()
        }

class UploadedAudioBase(BaseModel):
    survey_id: Optional[int] = None
    monitoring_site_id: Optional[int] = None
    filename: str
    filepath: str
    status: Optional[str] = "Pending Analysis"

class UploadedAudioCreate(UploadedAudioBase):
    pass

class UploadedAudioOut(UploadedAudioBase):
    id: int
    uploader_id: Optional[int] = None
    uploaded_at: datetime
    created_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    detections: Optional[List[Any]] = []
    biodiversity_metrics: Optional[dict] = None
    monitoring_report: Optional[dict] = None
    ecosystem_health_score: Optional[dict] = None
    animal_call_detected: Optional[bool] = False
    animal_call_category: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.replace(tzinfo=timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()
        }
