from pydantic import BaseModel
from typing import Optional, List

class ConservationOverview(BaseModel):
    priority_species: str
    critical_habitats: str
    restoration_projects: str
    monitoring_coverage: str
    protection_status: str
    recommendation_score: str

class ConservationPriorityPoint(BaseModel):
    species_name: str
    conservation_priority_score: float
    restoration_priority: float
    monitoring_priority: float
    protection_priority: float

class RestorationStatusPoint(BaseModel):
    sector: str
    Target: int
    Completed: int

class MonitoringOptimizationPoint(BaseModel):
    coverage: int
    Efficiency: int

class ResourceAllocationPoint(BaseModel):
    name: str
    Budget: float

class ActionableRecommendation(BaseModel):
    id: str
    title: str
    description: str
    priority: str
    category: str
    impact: str
    cost: str
    actionText: str
    completion_time: Optional[str] = None
    department: Optional[str] = None
    expected_impact: Optional[str] = None
    estimated_cost: Optional[str] = None
    priority_score: Optional[int] = None
