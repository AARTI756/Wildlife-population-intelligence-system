from pydantic import BaseModel
from typing import Optional

class SpeciesProfileBase(BaseModel):
    common_name: str
    scientific_name: str
    kingdom: Optional[str] = "Animalia"
    phylum: Optional[str] = "Chordata"
    class_name: Optional[str] = "Mammalia"
    order: Optional[str] = None
    family: Optional[str] = None
    genus: Optional[str] = None
    species: Optional[str] = None
    iucn_status: Optional[str] = None
    habitat: Optional[str] = None
    diet: Optional[str] = None
    distribution: Optional[str] = None
    description: Optional[str] = None

class SpeciesProfileCreate(SpeciesProfileBase):
    pass

class SpeciesProfileOut(SpeciesProfileBase):
    id: int

    class Config:
        from_attributes = True
