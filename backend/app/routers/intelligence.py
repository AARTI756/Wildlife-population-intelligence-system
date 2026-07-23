from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.intelligence import (
    ExecutiveOverview, ExecutivePopulationPoint, ExecutiveBiodiversityPoint,
    ExecutiveHabitatPoint, ExecutiveConservationPoint, ExecutiveActivityPoint, ExecutiveMapPin
)
from app.schemas.health import HealthAlertPoint
from app.services import executive_dashboard as edsp
from app.services import health_scoring as hsp

router = APIRouter(prefix="/api/intelligence", tags=["Executive Intelligence Command"])

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

@router.get("/overview", response_model=ExecutiveOverview)
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
    
    return edsp.get_executive_overview(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/population", response_model=List[ExecutivePopulationPoint])
def get_population(
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
    
    return edsp.get_executive_population_trends(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/biodiversity", response_model=List[ExecutiveBiodiversityPoint])
def get_biodiversity(
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
    
    return edsp.get_executive_biodiversity(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/habitat", response_model=List[ExecutiveHabitatPoint])
def get_habitat(
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
    
    return edsp.get_executive_habitat(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/conservation", response_model=List[ExecutiveConservationPoint])
def get_conservation(
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
    
    return edsp.get_executive_conservation(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/activity", response_model=List[ExecutiveActivityPoint])
def get_activity(
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
    
    return edsp.get_executive_activity(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/alerts", response_model=List[HealthAlertPoint])
def get_alerts(
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
    
    return hsp.get_health_alerts(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/map", response_model=List[ExecutiveMapPin])
def get_map(
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
    
    return edsp.get_executive_map_pins(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
