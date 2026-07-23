from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.conservation import (
    ConservationOverview, ConservationPriorityPoint, RestorationStatusPoint,
    MonitoringOptimizationPoint, ResourceAllocationPoint, ActionableRecommendation
)
from app.services import conservation_recommendations as crp

router = APIRouter(prefix="/api/conservation", tags=["Conservation Recommendation Engine"])

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

@router.get("/overview", response_model=ConservationOverview)
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
    
    return crp.get_conservation_overview(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/priorities", response_model=List[ConservationPriorityPoint])
def get_priorities(
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
    
    return crp.get_conservation_priorities(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/restoration", response_model=List[RestorationStatusPoint])
def get_restoration(
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
    
    return crp.get_restoration_status(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/monitoring", response_model=List[MonitoringOptimizationPoint])
def get_monitoring(
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
    
    return crp.get_monitoring_optimization(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/resources", response_model=List[ResourceAllocationPoint])
def get_resources(
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
    
    return crp.get_resource_allocation(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/actions", response_model=List[ActionableRecommendation])
def get_actions(
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
    
    return crp.get_actionable_recommendations(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
