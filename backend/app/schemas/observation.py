from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.schemas.monitoring import SurveyOut, MonitoringSiteOut, CameraTrapOut, AudioSensorOut
from app.schemas.upload import UploadedImageOut, UploadedAudioOut

class ObservationBase(BaseModel):
    survey_id: int
    monitoring_site_id: Optional[int] = None
    species_name: Optional[str] = None
    count: Optional[int] = 1
    timestamp: Optional[datetime] = None
    observation_type: str  # Visual, Camera Trap, Audio Sensor
    device_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "Pending Analysis"
    uploaded_image_id: Optional[int] = None
    uploaded_audio_id: Optional[int] = None
    is_unknown: Optional[bool] = False
    is_endangered: Optional[bool] = False
    behaviour: Optional[str] = None  # Future: feeding, resting, flying, hunting, etc.
    individual_id: Optional[str] = None
    reidentification_confidence: Optional[float] = None
    previous_sightings: Optional[int] = 0
    animal_call_detected: Optional[bool] = False
    animal_call_category: Optional[str] = None

class ObservationCreate(ObservationBase):
    pass

class ObservationUpdate(BaseModel):
    survey_id: Optional[int] = None
    monitoring_site_id: Optional[int] = None
    species_name: Optional[str] = None
    count: Optional[int] = None
    timestamp: Optional[datetime] = None
    observation_type: Optional[str] = None
    device_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    uploaded_image_id: Optional[int] = None
    uploaded_audio_id: Optional[int] = None
    is_unknown: Optional[bool] = None
    is_endangered: Optional[bool] = None
    behaviour: Optional[str] = None
    individual_id: Optional[str] = None
    reidentification_confidence: Optional[float] = None
    previous_sightings: Optional[int] = None

class ObservationOut(ObservationBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    
    # Nested fields and custom mappings required by WPIS
    species: Optional[str] = None
    method: Optional[str] = None
    observation_datetime: Optional[datetime] = None
    
    survey: Optional[SurveyOut] = None
    monitoring_site: Optional[MonitoringSiteOut] = None
    camera_trap: Optional[CameraTrapOut] = None
    audio_sensor: Optional[AudioSensorOut] = None
    image_upload: Optional[UploadedImageOut] = None
    audio_upload: Optional[UploadedAudioOut] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.replace(tzinfo=timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()
        }
