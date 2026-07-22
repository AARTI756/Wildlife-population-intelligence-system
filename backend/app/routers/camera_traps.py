from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.monitoring import CameraTrap, MonitoringSite
from app.models.user import User
from app.schemas.monitoring import CameraTrapOut, CameraTrapCreate, CameraTrapUpdate
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/camera-traps", tags=["camera-traps"])

# Allowed roles to modify camera traps
editor_check = RoleChecker(["Administrator", "Wildlife Researcher", "Forest Department Officer"])

@router.get("", response_model=List[CameraTrapOut])
def list_camera_traps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CameraTrap).all()

@router.get("/{trap_id}", response_model=CameraTrapOut)
def get_camera_trap(trap_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trap = db.query(CameraTrap).filter(CameraTrap.id == trap_id).first()
    if not trap:
        raise HTTPException(status_code=404, detail="Camera trap not found")
    return trap

@router.post("", response_model=CameraTrapOut, status_code=status.HTTP_201_CREATED)
def create_camera_trap(
    trap_in: CameraTrapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    # Verify monitoring site exists
    site = db.query(MonitoringSite).filter(MonitoringSite.id == trap_in.location_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monitoring site with ID {trap_in.location_id} does not exist"
        )
        
    trap = CameraTrap(
        name=trap_in.name,
        camera_id=trap_in.camera_id,
        status=trap_in.status,
        battery_level=trap_in.battery_level,
        location_id=trap_in.location_id,
        latitude=trap_in.latitude,
        longitude=trap_in.longitude,
        model=trap_in.model,
        installation_date=trap_in.installation_date
    )
    db.add(trap)
    db.commit()
    db.refresh(trap)
    return trap

@router.put("/{trap_id}", response_model=CameraTrapOut)
def update_camera_trap(
    trap_id: int,
    trap_in: CameraTrapUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    trap = db.query(CameraTrap).filter(CameraTrap.id == trap_id).first()
    if not trap:
        raise HTTPException(status_code=404, detail="Camera trap not found")
        
    if trap_in.location_id is not None:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == trap_in.location_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Monitoring site with ID {trap_in.location_id} does not exist"
            )
            
    for field, value in trap_in.model_dump(exclude_unset=True).items():
        setattr(trap, field, value)
        
    db.commit()
    db.refresh(trap)
    return trap

@router.delete("/{trap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera_trap(
    trap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    trap = db.query(CameraTrap).filter(CameraTrap.id == trap_id).first()
    if not trap:
        raise HTTPException(status_code=404, detail="Camera trap not found")
        
    db.delete(trap)
    db.commit()
    return None
