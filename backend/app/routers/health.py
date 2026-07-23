from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.schemas.health import (
    HealthOverview, HealthBreakdownPoint, HealthTrendPoint,
    HealthDistributionPoint, HealthComparisonPoint, HealthAlertPoint
)
from app.services import health_scoring as hsp

router = APIRouter(prefix="/api/health", tags=["Wildlife Health Scoring Engine"])

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

@router.get("/overview", response_model=HealthOverview)
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
    
    return hsp.get_health_overview(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/breakdown", response_model=List[HealthBreakdownPoint])
def get_breakdown(
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
    
    return hsp.get_health_breakdown(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/trends", response_model=List[HealthTrendPoint])
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
    
    return hsp.get_health_trends(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/distribution", response_model=List[HealthDistributionPoint])
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
    
    return hsp.get_health_distribution(
        db,
        survey_id=survey_id,
        site_id=site_id,
        species=species,
        habitat=habitat,
        date_from=date_from_dt,
        date_to=date_to_dt
    )

@router.get("/comparison", response_model=List[HealthComparisonPoint])
def get_comparison(
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
    
    return hsp.get_health_comparison(
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
