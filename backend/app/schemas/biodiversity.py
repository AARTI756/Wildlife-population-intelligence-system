from pydantic import BaseModel
from typing import Optional, List

class BiodiversityOverview(BaseModel):
    shannon_diversity_index: float
    simpson_diversity_index: float
    species_evenness: float
    species_richness: int
    observation_density: float
    endangered_species_count: int
    biodiversity_health_index: float

class DiversityPoint(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    location: str
    richness: int
    shannon: float
    simpson: float
    evenness: float
    protected_area: bool

class RelativeAbundancePoint(BaseModel):
    species_name: str
    scientific_name: Optional[str] = None
    observation_count: int
    relative_abundance_pct: float

class BiodiversityTrendsPoint(BaseModel):
    month: str
    shannon: float
    detections: int

class CompositionPoint(BaseModel):
    name: str
    value: float
    count: int
    color: str

class EndangeredSummaryPoint(BaseModel):
    species_name: str
    scientific_name: Optional[str] = None
    iucn_status: str
    observation_count: int
    reidentification_confidence: float

class HeatmapPoint(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    detections: int
    density: float
    protected_area: bool
