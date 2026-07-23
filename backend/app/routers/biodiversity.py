from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.biodiversity import (
    BiodiversityOverview, DiversityPoint, RelativeAbundancePoint,
    BiodiversityTrendsPoint, CompositionPoint, EndangeredSummaryPoint, HeatmapPoint
)
from app.services import biodiversity_analytics as bap

router = APIRouter(prefix="/api/biodiversity", tags=["Biodiversity Analytics Engine"])

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

@router.get("/overview", response_model=BiodiversityOverview)
def get_overview(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_biodiversity_overview(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/diversity", response_model=List[DiversityPoint])
def get_diversity(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_diversity_stats(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/abundance", response_model=List[RelativeAbundancePoint])
def get_abundance(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_relative_abundance(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/trends", response_model=List[BiodiversityTrendsPoint])
def get_trends(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_biodiversity_trends(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/composition", response_model=List[CompositionPoint])
def get_composition(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_species_composition(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/endangered", response_model=List[EndangeredSummaryPoint])
def get_endangered(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_endangered_summary(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )

@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap(
    survey_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    habitat: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    protected_area: Optional[bool] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    date_from_dt = parse_date(date_from)
    date_to_dt = parse_date(date_to)
    
    return bap.get_biodiversity_heatmap(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt,
        protected_area=protected_area,
        state=state
    )
