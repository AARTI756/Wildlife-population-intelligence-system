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
    lat: float
    lng: float
    popup: str
