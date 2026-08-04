from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class IntelligenceMetricItem(BaseModel):
    value: str
    subtext: str
    trend: str
    trendValue: str

class ExecutiveOverview(BaseModel):
    overallHealthScore: int
    monitoringStatus: str
    lastSync: str
    metrics: Dict[str, IntelligenceMetricItem]

class ExecutivePopulationPoint(BaseModel):
    name: str
    population: int

class ExecutiveBiodiversityPoint(BaseModel):
    name: str
    value: float
    color: str

class ExecutiveHabitatPoint(BaseModel):
    name: str
    health: int

class ExecutiveConservationPoint(BaseModel):
    name: str
    score: int
    color: str

class ExecutiveActivityPoint(BaseModel):
    id: str
    time: str
    site: str
    species: str
    sensor: str
    action: str

class ExecutiveMapPin(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: float
    lng: float
    popup: str
    type: Optional[str] = "site"
    site_name: Optional[str] = None
    survey_name: Optional[str] = None
    habitat_type: Optional[str] = None
    latest_detection: Optional[str] = None
    observation_count: Optional[int] = None
    last_updated: Optional[str] = None
    boundary: Optional[List[List[float]]] = None

