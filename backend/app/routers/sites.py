from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.monitoring import MonitoringSite
from app.models.user import User
from app.schemas.monitoring import MonitoringSiteOut, MonitoringSiteCreate, MonitoringSiteUpdate
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/monitoring-sites", tags=["monitoring-sites"])

# Allowed roles to modify sites
editor_check = RoleChecker(["Administrator", "Wildlife Researcher", "Conservation Officer"])

@router.get("", response_model=List[MonitoringSiteOut])
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MonitoringSite).all()

@router.get("/{site_id}", response_model=MonitoringSiteOut)
def get_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return site

@router.post("", response_model=MonitoringSiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: MonitoringSiteCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(editor_check)
):
    site = MonitoringSite(
        name=site_in.name,
        location=site_in.location,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        description=site_in.description,
        protected_area=site_in.protected_area
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.put("/{site_id}", response_model=MonitoringSiteOut)
def update_site(
    site_id: int,
    site_in: MonitoringSiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
        
    for field, value in site_in.model_dump(exclude_unset=True).items():
        setattr(site, field, value)
        
    db.commit()
    db.refresh(site)
    return site

@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
        
    db.delete(site)
    db.commit()
    return None
