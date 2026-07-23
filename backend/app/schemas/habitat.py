from pydantic import BaseModel
from typing import Optional, List

class HabitatOverview(BaseModel):
    habitat_quality_score: float
    vegetation_coverage: float
    water_availability: float
    environmental_condition: float
    habitat_suitability: float
    human_disturbance: float

class HabitatClassificationPoint(BaseModel):
    name: str
    value: float
    observations: int
    color: str

class VegetationAnalysisPoint(BaseModel):
    month: str
    ndvi: float

class EnvironmentMonitoringPoint(BaseModel):
    day: str
    temp: float
    humidity: float

class DegradationIndexPoint(BaseModel):
    sector: str
    index: float

class SiteSuitabilityPoint(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    location: str
    habitat_type: str
    suitability_score: float
    quality_score: float
    human_disturbance: float
    protected_area: bool

class TimelineEvent(BaseModel):
    id: str
    date: str
    event: str
    category: str
    severity: str
    notes: str
