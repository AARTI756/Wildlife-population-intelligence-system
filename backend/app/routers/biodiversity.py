from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.services.biodiversity_analytics import build_biodiversity_summary

router = APIRouter(prefix="/api/biodiversity", tags=["Biodiversity Analytics"])

@router.get("/summary")
def biodiversity_summary(survey_id: Optional[int] = None, monitoring_site_id: Optional[int] = None,
                        include_unknown: bool = False,
                        db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return build_biodiversity_summary(db, survey_id, monitoring_site_id, include_unknown)
