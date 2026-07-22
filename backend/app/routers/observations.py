from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.observation import Observation
from app.models.monitoring import Survey
from app.models.user import User
from app.schemas.observation import ObservationOut, ObservationCreate, ObservationUpdate
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/observations", tags=["observations"])

# Allowed roles to modify observations
editor_check = RoleChecker([
    "Administrator", 
    "Wildlife Researcher", 
    "Conservation Officer", 
    "Forest Department Officer"
])

@router.get("", response_model=List[ObservationOut])
def list_observations(include_unknown: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Observation)
    if not include_unknown:
        query = query.filter(
            Observation.species_name != "Unknown Species",
            (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
        )
    return query.order_by(Observation.timestamp.desc()).all()

@router.get("/report")
def generate_observations_report(
    survey_id: Optional[int] = None,
    monitoring_site_id: Optional[int] = None,
    device_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    species_name: Optional[str] = None,
    observation_type: Optional[str] = None,
    threat_level: Optional[str] = None,
    iucn_status: Optional[str] = None,
    include_unknown: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    query = db.query(Observation)
    
    if not include_unknown:
        query = query.filter(
            Observation.species_name != "Unknown Species",
            (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
        )
        
    if survey_id is not None:
        query = query.filter(Observation.survey_id == survey_id)
    if monitoring_site_id is not None:
        query = query.filter(Observation.monitoring_site_id == monitoring_site_id)
    if device_id:
        query = query.filter(Observation.device_id == device_id)
        
    if start_date:
        try:
            # Handle YYYY-MM-DD
            if len(start_date) == 10:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            else:
                start_dt = datetime.fromisoformat(start_date.replace("Z", ""))
            query = query.filter(Observation.timestamp >= start_dt)
        except Exception:
            pass
            
    if end_date:
        try:
            if len(end_date) == 10:
                end_dt = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            else:
                end_dt = datetime.fromisoformat(end_date.replace("Z", ""))
            query = query.filter(Observation.timestamp <= end_dt)
        except Exception:
            pass
            
    if species_name:
        query = query.filter(Observation.species_name.ilike(f"%{species_name}%"))
        
    if observation_type:
        if observation_type.lower() == "image":
            query = query.filter(Observation.observation_type == "Camera Trap")
        elif observation_type.lower() == "audio":
            query = query.filter(Observation.observation_type == "Audio Sensor")
            
    observations = query.all()
    
    # Filter by threat level or IUCN if requested
    from app.services.species_catalog import species_catalog
    filtered_obs = []
    for o in observations:
        cat_entry = species_catalog.lookup(o.species_name) or {}
        
        # Check IUCN
        entry_iucn = cat_entry.get("iucn_status") or "Least Concern"
        if iucn_status and iucn_status.lower() != "all" and iucn_status.lower() not in entry_iucn.lower():
            continue
            
        # Check Threat Level
        entry_threat = cat_entry.get("threat_level") or "Low"
        if threat_level and threat_level.lower() != "all" and threat_level.lower() not in entry_threat.lower():
            continue
            
        filtered_obs.append(o)
        
    observations = filtered_obs
    
    # Calculate summary metrics
    import math
    species_counts = {}
    type_counts = {}
    endangered_count = 0
    threatened_list = []
    
    for o in observations:
        if o.species_name == "Unknown Species" or o.is_unknown:
            continue
        species_counts[o.species_name] = species_counts.get(o.species_name, 0) + o.count
        type_counts[o.observation_type] = type_counts.get(o.observation_type, 0) + 1
        
        cat_entry = species_catalog.lookup(o.species_name) or {}
        iucn = cat_entry.get("iucn_status") or "Least Concern"
        if iucn in ["Vulnerable", "Endangered", "Critically Endangered"]:
            endangered_count += 1
            if o.species_name not in threatened_list:
                threatened_list.append(o.species_name)
                
    total_animals = sum(species_counts.values())
    species_richness = len(species_counts)
    
    if total_animals > 0:
        proportions = [count / total_animals for count in species_counts.values()]
        shannon = -sum(p * math.log(p) for p in proportions if p > 0)
        simpson = 1 - sum(p * p for p in proportions)
    else:
        shannon = 0.0
        simpson = 0.0
        
    # Generate list of recommendations/conservation alerts
    alerts = []
    if endangered_count > 0:
        alerts.append(f"CRITICAL CONSERVATION ALERT: {len(threatened_list)} threatened species detected: {', '.join(threatened_list)}.")
        alerts.append("Enforce strict anti-poaching patrols and secure local habitats immediately.")
    else:
        alerts.append("No immediate conservation threats. Maintain standard surveillance and monitoring protocols.")
        
    report_data = {
        "report_metadata": {
            "title": "WPIS Wildlife Monitoring Report",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "generated_by": current_user.username,
            "total_observations": len(observations),
            "total_animals_detected": total_animals,
            "species_richness": species_richness,
            "shannon_diversity_index": round(shannon, 4),
            "simpson_diversity_index": round(simpson, 4),
            "threatened_species_count": endangered_count,
            "filters": {
                "survey_id": survey_id,
                "monitoring_site_id": monitoring_site_id,
                "device_id": device_id,
                "start_date": start_date,
                "end_date": end_date,
                "species_name": species_name,
                "observation_type": observation_type,
                "threat_level": threat_level,
                "iucn_status": iucn_status
            }
        },
        "species_summary": [
            {
                "species": sp,
                "count": count,
                "avg_confidence": round(sum([o.reidentification_confidence or 0.85 for o in observations if o.species_name == sp]) / max(sum([1 for o in observations if o.species_name == sp]), 1), 4),
                "threat_level": (species_catalog.lookup(sp) or {}).get("threat_level") or "Low",
                "iucn_status": (species_catalog.lookup(sp) or {}).get("iucn_status") or "Least Concern"
            }
            for sp, count in species_counts.items()
        ],
        "behaviour_summary": list({o.behaviour for o in observations if o.behaviour}),
        "conservation_alerts": alerts,
        "observations": [
            {
                "id": o.id,
                "species_name": o.species_name,
                "count": o.count,
                "timestamp": o.timestamp.isoformat() if o.timestamp else None,
                "observation_type": o.observation_type,
                "notes": o.notes,
                "status": o.status,
                "behaviour": o.behaviour,
                "device_id": o.device_id,
                "monitoring_site_id": o.monitoring_site_id,
                "survey_id": o.survey_id
            }
            for o in observations
        ]
    }
    return report_data

@router.get("/{obs_id}", response_model=ObservationOut)
def get_observation(obs_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obs = db.query(Observation).filter(Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs

@router.post("", response_model=ObservationOut, status_code=status.HTTP_201_CREATED)
def create_observation(
    obs_in: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    # Verify survey exists
    survey = db.query(Survey).filter(Survey.id == obs_in.survey_id).first()
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Survey with ID {obs_in.survey_id} does not exist"
        )
        
    obs = Observation(
        survey_id=obs_in.survey_id,
        monitoring_site_id=obs_in.monitoring_site_id,
        species_name=obs_in.species_name,
        count=obs_in.count,
        timestamp=obs_in.timestamp if obs_in.timestamp else None,
        observation_type=obs_in.observation_type,
        device_id=obs_in.device_id,
        notes=obs_in.notes,
        status=obs_in.status if obs_in.status else "Pending Analysis",
        behaviour=obs_in.behaviour,
        individual_id=obs_in.individual_id,
        reidentification_confidence=obs_in.reidentification_confidence,
        previous_sightings=obs_in.previous_sightings,
        uploaded_image_id=obs_in.uploaded_image_id,
        uploaded_audio_id=obs_in.uploaded_audio_id,
        created_by=current_user.id
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs

@router.put("/{obs_id}", response_model=ObservationOut)
def update_observation(
    obs_id: int,
    obs_in: ObservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    obs = db.query(Observation).filter(Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
        
    if obs_in.survey_id is not None:
        survey = db.query(Survey).filter(Survey.id == obs_in.survey_id).first()
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Survey with ID {obs_in.survey_id} does not exist"
            )
            
    for field, value in obs_in.model_dump(exclude_unset=True).items():
        setattr(obs, field, value)
        
    db.commit()
    db.refresh(obs)
    return obs

@router.delete("/{obs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
    obs_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    obs = db.query(Observation).filter(Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
        
    db.delete(obs)
    db.commit()
    return None
