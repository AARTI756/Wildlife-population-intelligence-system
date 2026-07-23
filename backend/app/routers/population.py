from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.population import (
    PopulationOverview, SpeciesPopulationMetric, PopulationTrends, 
    PopulationDistribution, SiteDensity, SiteRichness
)
from app.services import population_estimation as pep

router = APIRouter(prefix="/api/population", tags=["Population Estimation Engine"])

def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Defensive date parser supporting ISO and YYYY-MM-DD strings."""
    if not date_str:
        return None
    try:
        cleaned = date_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            return None

@router.get("/overview", response_model=PopulationOverview)
def get_overview(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.get_population_overview(
        db, 
        survey_id=survey_id, 
        site_id=site_id, 
        species=species, 
        habitat=habitat, 
        date_from=date_from_dt, 
        date_to=date_to_dt
    )

@router.get("/species", response_model=List[SpeciesPopulationMetric])
def get_species(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.get_species_metrics(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/trends", response_model=PopulationTrends)
def get_trends(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.get_population_trends(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/distribution", response_model=PopulationDistribution)
def get_distribution(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.calculate_distribution_statistics(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/density", response_model=List[SiteDensity])
def get_density(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.get_site_densities(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/richness", response_model=List[SiteRichness])
def get_richness(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return pep.get_richness_stats(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
