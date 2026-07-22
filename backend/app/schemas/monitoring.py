from pydantic import BaseModel
from typing import Optional
from datetime import date as datetime_date, datetime

# Monitoring Site Schemas
class MonitoringSiteBase(BaseModel):
    name: str
    location: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    protected_area: Optional[bool] = False

class MonitoringSiteCreate(MonitoringSiteBase):
    pass

class MonitoringSiteUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    protected_area: Optional[bool] = None

class MonitoringSiteOut(MonitoringSiteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Camera Trap Schemas
class CameraTrapBase(BaseModel):
    name: str
    camera_id: Optional[str] = None
    status: Optional[str] = "Active"
    battery_level: Optional[int] = 100
    location_id: int
    latitude: float
    longitude: float
    model: Optional[str] = None
    installation_date: datetime_date

class CameraTrapCreate(CameraTrapBase):
    pass

class CameraTrapUpdate(BaseModel):
    name: Optional[str] = None
    camera_id: Optional[str] = None
    status: Optional[str] = None
    battery_level: Optional[int] = None
    location_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model: Optional[str] = None
    installation_date: Optional[datetime_date] = None

class CameraTrapOut(CameraTrapBase):
    id: int

    class Config:
        from_attributes = True

# Audio Sensor Schemas
class AudioSensorBase(BaseModel):
    name: str
    sensor_id: Optional[str] = None
    status: Optional[str] = "Active"
    battery_level: Optional[int] = 100
    location_id: int
    latitude: float
    longitude: float
    model: Optional[str] = None
    installation_date: datetime_date

class AudioSensorCreate(AudioSensorBase):
    pass

class AudioSensorUpdate(BaseModel):
    name: Optional[str] = None
    sensor_id: Optional[str] = None
    status: Optional[str] = None
    battery_level: Optional[int] = None
    location_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model: Optional[str] = None
    installation_date: Optional[datetime_date] = None

class AudioSensorOut(AudioSensorBase):
    id: int

    class Config:
        from_attributes = True

# Survey Schemas
class SurveyBase(BaseModel):
    name: str
    date: datetime_date
    monitoring_location: str
    latitude: float
    longitude: float
    habitat_type: str
    monitoring_device: str
    protected_area: Optional[bool] = False
    description: Optional[str] = None
    monitoring_site_id: Optional[int] = None

class SurveyCreate(SurveyBase):
    pass

class SurveyUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime_date] = None
    monitoring_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    habitat_type: Optional[str] = None
    monitoring_device: Optional[str] = None
    protected_area: Optional[bool] = None
    description: Optional[str] = None
    monitoring_site_id: Optional[int] = None

class SurveyOut(SurveyBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
