from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PopulationOverview(BaseModel):
    total_estimated_population: int
    average_density: float
    total_species_richness: int
    average_growth_rate: Optional[float] = None
    average_observation_coverage: float
    total_observations: int
    average_confidence: float

class SpeciesPopulationMetric(BaseModel):
    species_name: str
    scientific_name: Optional[str] = None
    estimated_population: int
    population_density: float
    observation_count: int
    detection_frequency: float
    observation_coverage: float
    species_richness: int
    average_confidence: float
    survey_count: int
    monitoring_site_count: int
    latest_observation: Optional[str] = None

class TimeSeriesPoint(BaseModel):
    count: int

class DailyPoint(TimeSeriesPoint):
    date: str

class WeeklyPoint(TimeSeriesPoint):
    week: str

class MonthlyPoint(TimeSeriesPoint):
    month: str

class PopulationTrends(BaseModel):
    growth_rate_pct: Optional[float] = None
    decline_rate_pct: Optional[float] = None
    stable_trend: bool
    daily: List[DailyPoint]
    weekly: List[WeeklyPoint]
    monthly: List[MonthlyPoint]

class NamedCount(BaseModel):
    name: str
    count: int

class PopulationDistribution(BaseModel):
    by_survey: List[NamedCount]
    by_site: List[NamedCount]
    by_habitat: List[NamedCount]
    by_state: List[NamedCount]
    by_protected: List[NamedCount]
    by_species: List[NamedCount]

class SiteDensity(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    location: str
    estimated_population: int
    density: float
    protected_area: bool
    species_count: Optional[int] = 0
    individuals: Optional[int] = 0
    latest_observation: Optional[str] = "None"
    site_area: Optional[float] = None
    population_count: Optional[int] = None
    survey_name: Optional[str] = "No Active Survey"
    observation_count: Optional[int] = 0

class SiteRichness(BaseModel):
    site_id: int
    site_name: str
    richness: int

class MigrationVector(BaseModel):
    species: str
    first_site: str
    first_lat: float
    first_lng: float
    second_site: str
    second_lat: float
    second_lng: float
    distance_km: float
    travel_time_hours: float
    confidence: float
    days_between: float
    observation_count: int

class DistributionMapPoint(BaseModel):
    lat: float
    lng: float
    species: str
    confidence: float
    date: str
    site_name: str
    survey_name: str
    count: int
