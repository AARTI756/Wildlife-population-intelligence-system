import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.models.upload import UploadedAudio
from app.models.observation import Observation
from app.models.prediction_history import PredictionHistory
from app.models.species import SpeciesProfile
from app.services.birdnet_service import analyze_audio_file
from app.services.species_resolver import resolve_species_profile, build_profile_data, build_empty_profile_data
from app.services.species_enrichment import enrich_missing_profile
from app.services.behaviour_service import get_fallback_behaviour, serialise_behaviour
from typing import Optional, List
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/audio",
    tags=["Audio AI Analysis"]
)

UPLOAD_DIR = "uploads"
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    survey_id: Optional[int] = Form(None),
    monitoring_site_id: Optional[int] = Form(None),
    audio_sensor_id: Optional[int] = Form(None),
    confidence_threshold: float = Form(0.50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify file is not empty
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty upload. Please provide a valid audio file."
        )
        
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported audio formats: WAV, MP3, FLAC, AAC, OGG."
        )
        
    # Save audio file permanently to disk
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(AUDIO_DIR, unique_filename)
    
    try:
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write audio file: {str(e)}"
        )
        
    # Save metadata to DB
    db_filepath = f"/uploads/audio/{unique_filename}"
    db_audio = UploadedAudio(
        survey_id=survey_id,
        monitoring_site_id=monitoring_site_id,
        filename=file.filename,
        filepath=db_filepath,
        uploader_id=current_user.id,
        status="Pending Analysis",
        uploaded_at=datetime.utcnow()
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)
    
    try:
        # Clean up old records for this audio file (avoid duplicate entries on retry)
        db.query(Observation).filter(Observation.uploaded_audio_id == db_audio.id).delete()
        db.query(PredictionHistory).filter(PredictionHistory.stored_filename == unique_filename).delete()
        db.commit()

        start_time = time.time()
        
        # Import shared species resolver and new services
        from app.services.species_resolver import resolve_species_profile, build_profile_data, build_empty_profile_data
        from app.services.species_enrichment import enrich_missing_profile
        from app.services.behaviour_service import get_fallback_behaviour, serialise_behaviour
        from app.services.confidence_service import estimate_confidence
        from app.services.species_lookup_service import lookup_species_profile
        from app.services.prediction_formatter import format_prediction_response
        from app.services.report_service import generate_wildlife_monitoring_report
        from app.services.biodiversity_analytics import compute_biodiversity_metrics
        from app.services.health_score_service import compute_ecosystem_health_score
        from app.services.yamnet_service import yamnet_service

        # Run BirdNET analysis
        results = analyze_audio_file(filepath)
        raw_detections = results.get("detections") or []
        
        # Check if BirdNET detected a bird with confidence above threshold
        bird_detected_above_threshold = any(
            det["confidence"] >= confidence_threshold for det in raw_detections
        )
        
        animal_call_detected = False
        animal_call_category = "Environmental Noise"
        
        if bird_detected_above_threshold:
            animal_call_detected = True
            animal_call_category = "Generic Animal Vocalization"
            raw_detections = [d for d in raw_detections if d["confidence"] >= confidence_threshold]
        else:
            # Run YAMNet inference
            yamnet_res = yamnet_service.run_inference(filepath)
            animal_call_detected = yamnet_res.get("animal_call_detected", False)
            animal_call_category = yamnet_res.get("animal_call_category", "Environmental Noise")
            
            if animal_call_detected:
                import librosa
                try:
                    duration = float(librosa.get_duration(path=filepath))
                except Exception:
                    duration = 3.0
                    
                raw_detections = [{
                    "common_name": animal_call_category,
                    "scientific_name": yamnet_res.get("primary_class", "Animalia"),
                    "confidence": yamnet_res.get("confidence", 0.0),
                    "start_time": 0.0,
                    "end_time": duration
                }]
            else:
                raw_detections = []
                
        inference_time_ms = (time.time() - start_time) * 1000

        # Save these fields inside the uploaded audio record
        db_audio.animal_call_detected = animal_call_detected
        db_audio.animal_call_category = animal_call_category
        db.commit()
        
        species_counts = {}
        species_confidences = {}
        mapped_detections = []
        
        # Resolve profiles for raw detections
        for det in raw_detections:
            raw_species = det["common_name"]
            confidence = det["confidence"]
            
            raw_display_name = raw_species.replace('-', ' ').title() if hasattr(raw_species, 'replace') else raw_species
            
            is_yamnet_category = raw_species in ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"]
            if is_yamnet_category:
                is_unknown = True
                is_likely = False
            else:
                confidence_level = estimate_confidence(confidence)
                is_unknown = confidence_level == "UNKNOWN"
                is_likely = confidence_level == "LOW"
            
            if is_unknown:
                species_name = "Unknown Species"
                profile_available = False
                profile_data = None
                is_endangered = False
                if is_yamnet_category:
                    species_name = raw_species
                    profile_data = build_empty_profile_data(raw_species)
            else:
                # Search species_catalog.json via species_lookup_service
                catalog_profile = lookup_species_profile(raw_species)
                if catalog_profile and not catalog_profile.get("profile_not_found", False):
                    profile_available = True
                    profile = resolve_species_profile(raw_species, db)
                    if not profile:
                        profile = enrich_missing_profile(raw_species, db)
                    if profile:
                        profile_data = build_profile_data(profile)
                    else:
                        profile_data = catalog_profile
                else:
                    profile = resolve_species_profile(raw_species, db)
                    if not profile:
                        profile = enrich_missing_profile(raw_species, db)
                    profile_available = profile is not None
                    if profile:
                        profile_data = build_profile_data(profile)
                    else:
                        profile_data = build_empty_profile_data(raw_species)

                species_name = profile_data.get("common_name") or raw_display_name
                
                # Endangered checks
                iucn = profile_data.get("iucn_status") or 'Least Concern'
                is_endangered = iucn in ['Vulnerable', 'Endangered', 'Critically Endangered']
                
            det["resolved_species"] = species_name
            det["raw_display_name"] = raw_display_name
            det["profile_data"] = profile_data
            det["profile_available"] = profile_available
            det["is_unknown"] = is_unknown
            det["is_likely"] = is_likely
            det["is_endangered"] = is_endangered
            det["raw_species"] = raw_species
            det["behaviour"] = None
            
            species_counts[species_name] = species_counts.get(species_name, 0) + 1
            species_confidences[species_name] = max(species_confidences.get(species_name, 0.0), confidence)
            
        # Create Observations
        created_observations = {}
        if survey_id and len(species_counts) > 0:
            device_id = None
            if monitoring_site_id:
                from app.models.monitoring import AudioSensor
                sensor = db.query(AudioSensor).filter(AudioSensor.location_id == monitoring_site_id).first()
                if sensor:
                    device_id = sensor.sensor_id or sensor.name
                    
            for species_name, count in species_counts.items():
                max_conf = species_confidences[species_name]
                det_ref = next((d for d in raw_detections if d["resolved_species"] == species_name), None)
                is_unk = det_ref["is_unknown"] if det_ref else True
                is_lk = det_ref.get("is_likely", False) if det_ref else False
                is_end = det_ref["is_endangered"] if det_ref else False
                
                if is_unk:
                    status_str = "Expert Validation Required"
                elif is_lk:
                    status_str = "Likely Species"
                else:
                    status_str = "Analyzed"
                    
                notes = f'AI detected {species_name} via audio sensor analysis. Source: AI Generated.'
                if is_unk:
                    notes += f' Low confidence ({max_conf:.0%}) — flagged for expert validation.'
                elif is_lk:
                    notes += f' Likely species ({max_conf:.0%}) — validation recommended.'
                
                obs = Observation(
                    survey_id=survey_id,
                    monitoring_site_id=monitoring_site_id,
                    species_name=species_name,
                    count=count,
                    timestamp=datetime.utcnow(),
                    observation_type="Audio Sensor",
                    device_id=device_id,
                    notes=notes,
                    status=status_str,
                    is_unknown=is_unk,
                    is_endangered=is_end,
                    uploaded_audio_id=db_audio.id,
                    created_by=current_user.id,
                    behaviour=None,
                    animal_call_detected=animal_call_detected,
                    animal_call_category=animal_call_category
                )
                db.add(obs)
                db.flush()
                created_observations[species_name] = obs
                
        # Create PredictionHistory
        for det in raw_detections:
            species_name = det["resolved_species"]
            confidence = det["confidence"]
            is_unk = det["is_unknown"]
            is_lk = det.get("is_likely", False)
            is_end = det["is_endangered"]
            raw_species = det["raw_species"]
            
            linked_obs = created_observations.get(species_name)
            linked_obs_id = linked_obs.id if linked_obs else None
            
            raw_display_name = det["raw_display_name"]
            is_yamnet_category = raw_species in ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"]
            
            pred_hist = PredictionHistory(
                original_filename=file.filename,
                stored_filename=unique_filename,
                species_predicted="Unknown Species" if is_unk and not is_yamnet_category else species_name,
                confidence=confidence,
                inference_time=inference_time_ms,
                user_id=current_user.id,
                date=datetime.utcnow(),
                prediction_type="Audio",
                linked_observation_id=linked_obs_id,
                threshold_used=confidence_threshold,
                is_unknown=is_unk,
                is_endangered=is_end,
                behaviour=None,
                animal_call_detected=animal_call_detected,
                animal_call_category=animal_call_category
            )
            db.add(pred_hist)
            db.flush()
            
            # Format API prediction structure using the prediction_formatter
            formatted_res = format_prediction_response(
                species_name=species_name,
                confidence=confidence,
                bbox=None,
                profile=det["profile_data"] if (det["profile_available"] and not is_unk) else None,
                image_quality=None,
                processing_time_ms=inference_time_ms
            )
            
            mapped_detections.append({
                "species": species_name,
                "raw_prediction": raw_display_name,
                "scientific_name": det["profile_data"]["scientific_name"] if det["profile_data"] else "Not Available",
                "confidence": confidence,
                "start_time": det.get("start_time", 0.0),
                "end_time": det.get("end_time", 0.0),
                "species_profile": det["profile_data"],
                "profile_available": det["profile_available"],
                "profile_message": None if det["profile_available"] else "Species profile not yet available in WPIS.",
                "is_endangered": is_end,
                "is_unknown": is_unk,
                "is_likely": is_lk,
                "observation_id": linked_obs_id,
                "behaviour": None,
                "prediction_history_id": pred_hist.id,
                
                # Part 3 / Pydantic formatted properties
                "species_prediction": formatted_res["species_prediction"],
                "confidence_level": formatted_res["confidence_level"],
                "status": formatted_res["status"],
                "bounding_boxes": formatted_res["bounding_boxes"],
                "recommendation": formatted_res.get("recommendation"),
                "processing_time": inference_time_ms
            })
            
        # Calculate biodiversity metrics
        biodiversity_metrics = compute_biodiversity_metrics(mapped_detections)
        
        # Calculate ecosystem health score
        ecosystem_health_score = compute_ecosystem_health_score(
            biodiversity_metrics=biodiversity_metrics,
            observation_statistics={"total_count": len(mapped_detections), "trend": "Stable"},
            habitat_quality={"score": 84},
            environmental_conditions={"score": 88}
        )
        
        # Fetch survey details if available for report
        survey_info = None
        if survey_id:
            from app.models.monitoring import Survey
            survey_db = db.query(Survey).filter(Survey.id == survey_id).first()
            if survey_db:
                survey_info = {
                    "project_name": survey_db.name,
                    "description": survey_db.description or "Automated species surveillance",
                    "site_id": monitoring_site_id,
                    "survey_id": survey_id
                }
                
        # Generate wildlife report
        monitoring_report = generate_wildlife_monitoring_report(
            filename=file.filename,
            stored_filename=unique_filename,
            detections=mapped_detections,
            biodiversity_metrics=biodiversity_metrics,
            image_quality=None,
            processing_time_ms=inference_time_ms,
            survey_info=survey_info,
            prediction_type="Audio"
        )
            
        # Generate automatic AI summary paragraph
        if len(raw_detections) == 0:
            ai_summary = "No biological calls detected. Recording classified as Environmental Noise."
        else:
            # Check if any detection is YAMNet category
            yamnet_dets = [d for d in raw_detections if d["raw_species"] in ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"]]
            if yamnet_dets:
                primary_cat = yamnet_dets[0]["resolved_species"]
                ai_summary = f"Bioacoustic AI detected {primary_cat}. Species identification unavailable. Manual verification recommended."
            else:
                num_vocalizations = len(raw_detections)
                avg_conf = sum(d["confidence"] for d in raw_detections) / num_vocalizations
                quality_str = "Excellent" if avg_conf >= 0.85 else ("Good" if avg_conf >= 0.65 else "Fair")
                ai_summary = f"Bioacoustic AI detected {num_vocalizations} bird vocalization{'s' if num_vocalizations > 1 else ''}. Average confidence: {int(avg_conf * 100)}%. Recording quality: {quality_str}."
            
        # Update audio status to Analyzed and assign AI summary
        db_audio.status = "Analyzed"
        db_audio.ai_summary = ai_summary
        db.commit()
        db.refresh(db_audio)
        
        # Attach detections and reports dynamically
        db_audio.detections = mapped_detections
        db_audio.biodiversity_metrics = biodiversity_metrics
        db_audio.monitoring_report = monitoring_report
        db_audio.ecosystem_health_score = ecosystem_health_score
        
    except Exception as e:
        db.rollback()
        logger.exception("BirdNET analysis failed for uploaded audio id=%s", db_audio.id)
        db_audio.status = "Analysis Failed"
        db_audio.ai_summary = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"stage": "birdnet_inference", "message": str(e)}
        ) from e
        
    # Build complete return payload matching image upload response structure
    return {
        "id": db_audio.id,
        "survey_id": db_audio.survey_id,
        "monitoring_site_id": db_audio.monitoring_site_id,
        "filename": db_audio.filename,
        "filepath": db_audio.filepath,
        "status": db_audio.status,
        "ai_summary": db_audio.ai_summary,
        "detections": db_audio.detections,
        "biodiversity_metrics": db_audio.biodiversity_metrics,
        "monitoring_report": db_audio.monitoring_report,
        "ecosystem_health_score": db_audio.ecosystem_health_score,
        "uploaded_at": db_audio.uploaded_at.isoformat() + "Z" if db_audio.uploaded_at else None,
        "animal_call_detected": animal_call_detected,
        "animal_call_category": animal_call_category
    }
