from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.monitoring import Survey, MonitoringSite, CameraTrap, AudioSensor
from app.models.observation import Observation
from app.models.upload import UploadedImage, UploadedAudio
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, date, time
    
    from app.models.prediction_history import PredictionHistory
    
    total_surveys = db.query(Survey).count()
    total_sites = db.query(MonitoringSite).count()
    total_camera_traps = db.query(CameraTrap).count()
    total_audio_sensors = db.query(AudioSensor).count()
    total_uploaded_images = db.query(UploadedImage).count()
    total_uploaded_audio = db.query(UploadedAudio).count()
    total_users = db.query(User).count()
    
    # 1. Total Observations
    total_observations = db.query(Observation).filter(
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).count()
    threatened_species = db.query(Observation.species_name).filter(
        Observation.is_endangered.is_(True),
        Observation.species_name.isnot(None),
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).distinct().count()
    
    # 2. Species Count (distinct species_name in all observations)
    species_count = db.query(Observation.species_name).filter(
        Observation.species_name.isnot(None),
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).distinct().count()
    
    # 3. Today's Observations (observations logged since start of today in UTC)
    today_start = datetime.combine(date.today(), time.min)
    todays_observations = db.query(Observation).filter(
        Observation.timestamp >= today_start,
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).count()
    
    # 4. Latest Species (most recently observed species name)
    latest_obs = db.query(Observation).filter(
        Observation.species_name.isnot(None),
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).order_by(Observation.timestamp.desc()).first()
    latest_species = latest_obs.species_name if latest_obs else "None"
    
    # 5. Active Camera Traps and Audio Sensors
    active_camera_traps = db.query(CameraTrap).filter(CameraTrap.status == "Active").count()
    active_audio_sensors = db.query(AudioSensor).filter(AudioSensor.status == "Active").count()
    
    # 6. AI Predictions counts by type
    ai_image_predictions = db.query(PredictionHistory).filter(PredictionHistory.prediction_type == "Image").count()
    ai_audio_predictions = db.query(PredictionHistory).filter(PredictionHistory.prediction_type == "Audio").count()
    prediction_history_count = db.query(PredictionHistory).count()
    
    # Get latest 5 observations
    recent_obs = db.query(Observation).filter(
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).order_by(Observation.timestamp.desc()).limit(5).all()
    
    recent_list = []
    for obs in recent_obs:
        survey = db.query(Survey).filter(Survey.id == obs.survey_id).first()
        recent_list.append({
            "id": obs.id,
            "survey_id": obs.survey_id,
            "survey_name": survey.name if survey else "Unknown Survey",
            "species_name": obs.species_name,
            "count": obs.count,
            "timestamp": obs.timestamp.isoformat() if obs.timestamp else None,
            "observation_type": obs.observation_type,
            "device_id": obs.device_id,
            "notes": obs.notes,
            "created_by": obs.created_by
        })
        
    # Calculate weekly observations chart data dynamically
    from datetime import timedelta
    chart_data = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        day_start = datetime.combine(day, time.min)
        day_end = datetime.combine(day, time.max)
        count = db.query(Observation).filter(
            Observation.timestamp >= day_start,
            Observation.timestamp <= day_end,
            Observation.species_name != "Unknown Species",
            (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
        ).count()
        chart_data.append({
            "name": day.strftime("%a"),
            "count": count
        })
        
    # Calculate telemetry node status ratios
    total_devices = total_camera_traps + total_audio_sensors
    active_devices = active_camera_traps + active_audio_sensors
    inactive_devices = (
        db.query(CameraTrap).filter(CameraTrap.status == "Inactive").count() +
        db.query(AudioSensor).filter(AudioSensor.status == "Inactive").count()
    )
    maintenance_devices = (
        db.query(CameraTrap).filter(CameraTrap.status == "Maintenance").count() +
        db.query(AudioSensor).filter(AudioSensor.status == "Maintenance").count()
    )
    
    if total_devices > 0:
        active_pct = int(round((active_devices / total_devices) * 100))
        inactive_pct = int(round((inactive_devices / total_devices) * 100))
        maintenance_pct = 100 - active_pct - inactive_pct
    else:
        active_pct = 0
        inactive_pct = 0
        maintenance_pct = 0

    device_distribution = [
        {"name": "Active", "value": active_pct, "color": "#059669"},
        {"name": "Inactive", "value": inactive_pct, "color": "#475569"},
        {"name": "Maintenance", "value": maintenance_pct, "color": "#d97706"}
    ]

    # Calculate global Shannon / Simpson / Richness indices from database observations
    all_obs = db.query(Observation).filter(
        Observation.species_name != None,
        Observation.species_name != "Unknown Species",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    ).all()
    
    total_animals = sum(o.count for o in all_obs)
    species_counts_all = {}
    for o in all_obs:
        species_counts_all[o.species_name] = species_counts_all.get(o.species_name, 0) + o.count
        
    species_richness = len(species_counts_all)
    
    import math
    if total_animals > 0:
        proportions = [count / total_animals for count in species_counts_all.values()]
        shannon = -sum(p * math.log(p) for p in proportions if p > 0)
        simpson = 1 - sum(p * p for p in proportions)
    else:
        shannon = 0.0
        simpson = 0.0
        
    from app.models.species import SpeciesProfile
    profiles = db.query(SpeciesProfile).all()
    profile_status_map = {p.common_name.lower().strip(): (p.iucn_status or "Least Concern") for p in profiles}
    
    endangered_count = 0
    vulnerable_count = 0
    least_concern_count = 0
    for o in all_obs:
        iucn = profile_status_map.get(o.species_name.lower().strip(), "Least Concern")
        iucn_lower = iucn.lower()
        if any(term in iucn_lower for term in ["critically endangered", "endangered", "cr", "en"]):
            endangered_count += o.count
        elif any(term in iucn_lower for term in ["vulnerable", "near threatened", "vu", "nt"]):
            vulnerable_count += o.count
        else:
            least_concern_count += o.count
            
    detection_distribution = [
        {"species": name, "count": count} for name, count in sorted(species_counts_all.items(), key=lambda x: x[1], reverse=True)
    ]
    
    timeline_counts = {}
    for o in all_obs:
        if o.timestamp:
            date_str = o.timestamp.strftime("%Y-%m-%d")
            timeline_counts[date_str] = timeline_counts.get(date_str, 0) + o.count
            
    detection_timeline = [
        {"date": date_str, "count": count} for date_str, count in sorted(timeline_counts.items())
    ]

    # Count of observations below 40% (Unknown Species / low confidence)
    unverified_observations = db.query(Observation).filter(
        (Observation.is_unknown.is_(True)) | (Observation.species_name == "Unknown Species")
    ).count()

    return {
        "total_surveys": total_surveys,
        "total_sites": total_sites,
        "total_camera_traps": total_camera_traps,
        "total_audio_sensors": total_audio_sensors,
        "total_uploaded_images": total_uploaded_images,
        "total_uploaded_audio": total_uploaded_audio,
        "total_users": total_users,
        "total_observations": total_observations,
        "species_count": species_count,
        "todays_observations": todays_observations,
        "latest_species": latest_species,
        "active_camera_traps": active_camera_traps,
        "active_audio_sensors": active_audio_sensors,
        "ai_image_predictions": ai_image_predictions,
        "ai_audio_predictions": ai_audio_predictions,
        # Explicit milestone-two names, retained alongside legacy dashboard names.
        "image_detections": ai_image_predictions,
        "audio_detections": ai_audio_predictions,
        "threatened_species": threatened_species,
        "prediction_history": prediction_history_count,
        "recent_observations": recent_list,
        "chart_data": chart_data,
        "device_distribution": device_distribution,
        "unverified_observations": unverified_observations,
        
        # Biodiversity analytics keys
        "total_species_detected": species_count,
        "total_animal_count": total_animals,
        "species_richness": species_richness,
        "shannon_diversity_index": round(shannon, 4),
        "simpson_diversity_index": round(simpson, 4),
        "endangered_species_count": endangered_count,
        "vulnerable_species_count": vulnerable_count,
        "least_concern_count": least_concern_count,
        "detection_distribution": detection_distribution,
        "detection_timeline": detection_timeline
    }
