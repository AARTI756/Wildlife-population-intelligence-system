from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.monitoring import AudioSensor, MonitoringSite
from app.models.user import User
from app.schemas.monitoring import AudioSensorOut, AudioSensorCreate, AudioSensorUpdate
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/audio-sensors", tags=["audio-sensors"])

# Allowed roles to modify audio sensors
editor_check = RoleChecker(["Administrator", "Wildlife Researcher", "Forest Department Officer"])

@router.get("", response_model=List[AudioSensorOut])
def list_audio_sensors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AudioSensor).all()

@router.get("/{sensor_id}", response_model=AudioSensorOut)
def get_audio_sensor(sensor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sensor = db.query(AudioSensor).filter(AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
    return sensor

@router.post("", response_model=AudioSensorOut, status_code=status.HTTP_201_CREATED)
def create_audio_sensor(
    sensor_in: AudioSensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    # Verify monitoring site exists
    site = db.query(MonitoringSite).filter(MonitoringSite.id == sensor_in.location_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monitoring site with ID {sensor_in.location_id} does not exist"
        )
        
    sensor = AudioSensor(
        name=sensor_in.name,
        sensor_id=sensor_in.sensor_id,
        status=sensor_in.status,
        battery_level=sensor_in.battery_level,
        location_id=sensor_in.location_id,
        latitude=sensor_in.latitude,
        longitude=sensor_in.longitude,
        model=sensor_in.model,
        installation_date=sensor_in.installation_date
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor

@router.put("/{sensor_id}", response_model=AudioSensorOut)
def update_audio_sensor(
    sensor_id: int,
    sensor_in: AudioSensorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    sensor = db.query(AudioSensor).filter(AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
        
    if sensor_in.location_id is not None:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == sensor_in.location_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Monitoring site with ID {sensor_in.location_id} does not exist"
            )
            
    for field, value in sensor_in.model_dump(exclude_unset=True).items():
        setattr(sensor, field, value)
        
    db.commit()
    db.refresh(sensor)
    return sensor

@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio_sensor(
    sensor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    sensor = db.query(AudioSensor).filter(AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
        
    db.delete(sensor)
    db.commit()
    return None
