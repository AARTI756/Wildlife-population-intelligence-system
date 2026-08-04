import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.models.upload import UploadedImage, UploadedAudio
from app.models.user import User
from app.schemas.upload import UploadedImageOut, UploadedAudioOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["uploads"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
IMAGES_DIR = os.path.join(UPLOAD_DIR, "images")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}

# Ensure directories exist
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

@router.post("/image", response_model=UploadedImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    survey_id: Optional[int] = Form(None),
    monitoring_site_id: Optional[int] = Form(None),
    confidence_threshold: float = Form(0.50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify file extension
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {ext} not allowed. Supported image types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Create safe unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(IMAGES_DIR, unique_filename)
    
    # Save file to disk
    try:
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write image file: {str(e)}"
        )
    
    # Save metadata to DB
    # We will store filepath relative to the server so it can be served/accessed
    db_filepath = f"/uploads/images/{unique_filename}"
    
    db_image = UploadedImage(
        survey_id=survey_id,
        monitoring_site_id=monitoring_site_id,
        filename=file.filename,
        filepath=db_filepath,
        uploader_id=current_user.id,
        status="Pending Analysis",
        uploaded_at=datetime.utcnow()
    )
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    # Run YOLOv11 Inference Service
    from app.services.yolo_service import yolo_service
    from app.models.species import SpeciesProfile
    from app.models.observation import Observation
    from app.models.prediction_history import PredictionHistory
    import time
    
    try:
        # Clean up old records for this image (avoid duplicate entries on retry)
        db.query(Observation).filter(Observation.uploaded_image_id == db_image.id).delete()
        db.query(PredictionHistory).filter(PredictionHistory.stored_filename == unique_filename).delete()
        db.commit()

        # Import shared species resolver and new services
        from app.services.species_resolver import resolve_species_profile, build_profile_data, build_empty_profile_data
        from app.services.species_enrichment import enrich_missing_profile
        from app.services.behaviour_service import analyse_detection_crop, serialise_behaviour
        from app.services.image_quality_service import assess_image_quality
        from app.services.reidentification_service import crop_signature, link_individual
        from app.services.confidence_service import estimate_confidence
        from app.services.species_lookup_service import lookup_species_profile
        from app.services.prediction_formatter import format_prediction_response
        from app.services.report_service import generate_wildlife_monitoring_report
        from app.services.biodiversity_analytics import compute_biodiversity_metrics

        start_time = time.time()
        # Single inference call with LOW threshold to capture all possible detections.
        raw_detections = yolo_service.run_inference(filepath, conf_threshold=0.10)
        inference_time_ms = (time.time() - start_time) * 1000
        
        # Process and map detections
        mapped_detections = []
        species_counts = {}
        species_confidences = {}
        
        # 1. Resolve species profiles and classify detections
        for det in raw_detections:
            raw_species = det["species"]
            confidence = det["confidence"]
            class_id = det["class_id"]
            bbox = det["bounding_box"]
            
            raw_display_name = raw_species.replace('-', ' ').title()
            
            # Ecological Plausibility validation
            is_marine = any(mk in raw_species.lower() for mk in ["whale", "shark", "jellyfish", "squid", "octopus", "marine fish", "stingray", "starfish", "lobster", "crab"])
            ecological_plausibility = "High"
            plausibility_reason = ""
            
            if is_marine and survey_id:
                from app.models.monitoring import Survey
                survey = db.query(Survey).filter(Survey.id == survey_id).first()
                if survey and survey.habitat_type:
                    terrestrial_habitats = ["forest", "grassland", "wetland", "mountain", "savannah", "desert", "shrubland", "terrestrial"]
                    if any(th in survey.habitat_type.lower() for th in terrestrial_habitats):
                        ecological_plausibility = "Low"
                        plausibility_reason = "Manual verification recommended. Terrestrial habitat camera trap detected marine life."
                        # Lower confidence score below the threshold (40%) to route as unverified
                        confidence = min(0.35, confidence)
            
            # Confidence estimation
            confidence_level = estimate_confidence(confidence)
            is_unknown = confidence_level == "UNKNOWN"
            is_likely = confidence_level == "LOW"
            
            if is_unknown:
                species_name = "Unknown Species"
                profile_available = False
                profile_data = None
                is_endangered = False
            else:
                # Search species_catalog.json via species_lookup_service
                catalog_profile = lookup_species_profile(raw_species)
                if catalog_profile and not catalog_profile.get("profile_not_found", False):
                    profile_available = True
                    # Sync into database to make sure SpeciesProfile is stored
                    profile = resolve_species_profile(raw_species, db)
                    if not profile:
                        profile = enrich_missing_profile(raw_species, db)
                    if profile:
                        profile_data = build_profile_data(profile)
                    else:
                        profile_data = catalog_profile
                else:
                    # Database lookup & Gemini fallback
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

            # Prediction quality refinement for Felidae family under 75% confidence
            is_possible_species = False
            candidates = []
            felidae_family = ["cat", "lynx", "lion", "tiger", "leopard", "cheetah", "asiatic lion"]
            if not is_unknown and raw_species.lower() in felidae_family and confidence < 0.75:
                is_possible_species = True
                choices = [c.title() for c in felidae_family if c != raw_species.lower()]
                choices.append("Fox")
                candidates = [
                    {"species": species_name, "confidence": confidence},
                    {"species": choices[0], "confidence": round(confidence - 0.03, 4)},
                    {"species": choices[1], "confidence": round(confidence - 0.07, 4)}
                ]
            
            det["resolved_species"] = species_name
            det["raw_display_name"] = raw_display_name
            det["profile_data"] = profile_data
            det["profile_available"] = profile_available
            det["is_possible_species"] = is_possible_species
            det["candidates"] = candidates
            det["is_unknown"] = is_unknown
            det["is_likely"] = is_likely
            det["is_endangered"] = is_endangered
            det["raw_species"] = raw_species
            det["confidence"] = confidence
            det["ecological_plausibility"] = ecological_plausibility
            det["plausibility_reason"] = plausibility_reason
            det["behaviour"] = analyse_detection_crop(filepath, bbox, species_name, has_multiple_detections=len(raw_detections) > 1) if not is_unknown else None
            det["individual_signature"] = crop_signature(filepath, bbox) if not is_unknown else None
            
            species_counts[species_name] = species_counts.get(species_name, 0) + 1
            species_confidences[species_name] = max(species_confidences.get(species_name, 0.0), confidence)
            
        # 2. Automatically create Observation records
        created_observations = {}
        if survey_id and len(species_counts) > 0:
            device_id = None
            if monitoring_site_id:
                from app.models.monitoring import CameraTrap
                trap = db.query(CameraTrap).filter(CameraTrap.location_id == monitoring_site_id).first()
                if trap:
                    device_id = trap.camera_id or trap.name
            
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
                    
                notes = f'AI detected {species_name} via camera trap analysis. Source: AI Generated.'
                if det_ref and det_ref.get("ecological_plausibility") == "Low":
                    notes += f" {det_ref.get('plausibility_reason')}"
                elif is_unk:
                    notes += f' Low confidence ({max_conf:.0%}) — flagged for expert validation.'
                elif is_lk:
                    notes += f' Likely species ({max_conf:.0%}) — validation recommended.'
                
                obs = Observation(
                    survey_id=survey_id,
                    monitoring_site_id=monitoring_site_id,
                    species_name=species_name,
                    count=count,
                    timestamp=datetime.utcnow(),
                    observation_type="Camera Trap",
                    device_id=device_id,
                    notes=notes,
                    status=status_str,
                    is_unknown=is_unk,
                    is_endangered=is_end,
                    behaviour=serialise_behaviour(det_ref.get("behaviour")) if det_ref else None,
                    individual_id=None,
                    uploaded_image_id=db_image.id,
                    created_by=current_user.id
                )
                db.add(obs)
                db.flush()
                
                if not is_unk:
                    individual_id, reid_confidence, previous_sightings = link_individual(db, species_name, det_ref.get("individual_signature") if det_ref else None)
                    obs.individual_id = individual_id
                    obs.reidentification_confidence = reid_confidence
                    obs.previous_sightings = previous_sightings
                    
                created_observations[species_name] = obs
                
        # 3. Create PredictionHistory records
        for det in raw_detections:
            species_name = det["resolved_species"]
            raw_display_name = det["raw_display_name"]
            confidence = det["confidence"]
            bbox = det["bounding_box"]
            is_unk = det["is_unknown"]
            is_lk = det.get("is_likely", False)
            is_end = det["is_endangered"]
            
            linked_obs = created_observations.get(species_name)
            linked_obs_id = linked_obs.id if linked_obs else None
            
            pred_hist = PredictionHistory(
                original_filename=file.filename,
                stored_filename=unique_filename,
                species_predicted="Unknown Species" if is_unk else species_name,
                confidence=confidence,
                inference_time=inference_time_ms,
                user_id=current_user.id,
                date=datetime.utcnow(),
                prediction_type="Image",
                linked_observation_id=linked_obs_id,
                threshold_used=confidence_threshold,
                is_unknown=is_unk,
                is_endangered=is_end,
                behaviour=serialise_behaviour(det.get("behaviour"))
            )
            db.add(pred_hist)
            db.flush()
            
            # Format API prediction structure using the prediction_formatter
            formatted_res = format_prediction_response(
                species_name=species_name,
                confidence=confidence,
                bbox=bbox,
                profile=det["profile_data"] if (det["profile_available"] and not is_unk) else None,
                image_quality=None,
                processing_time_ms=inference_time_ms
            )
            
            mapped_detections.append({
                "species": species_name,
                "raw_prediction": raw_display_name,
                "scientific_name": det["profile_data"]["scientific_name"] if det["profile_data"] else "Not Available",
                "confidence": confidence,
                "class_id": det["class_id"],
                "bounding_box": bbox,
                "species_profile": det["profile_data"],
                "profile_available": det["profile_available"],
                "profile_message": None if det["profile_available"] else "Species profile not yet available in WPIS.",
                "is_possible_species": det["is_possible_species"],
                "candidates": det["candidates"],
                "is_endangered": is_end,
                "is_unknown": is_unk,
                "is_likely": is_lk,
                "observation_id": linked_obs_id,
                "behaviour": det.get("behaviour"),
                "individual_id": linked_obs.individual_id if linked_obs else None,
                "reidentification_confidence": linked_obs.reidentification_confidence if linked_obs else None,
                "previous_sightings": linked_obs.previous_sightings if linked_obs else 0,
                "prediction_history_id": pred_hist.id,
                "ecological_plausibility": det.get("ecological_plausibility", "High"),
                "plausibility_reason": det.get("plausibility_reason", ""),
                
                # Part 3 / Pydantic formatted properties
                "species_prediction": formatted_res["species_prediction"],
                "confidence_level": formatted_res["confidence_level"],
                "status": formatted_res["status"],
                "bounding_boxes": formatted_res["bounding_boxes"],
                "recommendation": formatted_res.get("recommendation"),
                "processing_time": inference_time_ms
            })

        max_confidence = max((d["confidence"] for d in raw_detections), default=0)
        image_quality = assess_image_quality(filepath, max_confidence)
        
        # Calculate biodiversity metrics
        biodiversity_metrics = compute_biodiversity_metrics(mapped_detections)
        
        # Ecosystem health score belongs exclusively to the Wildlife Health Scoring Engine
        ecosystem_health_score = None
        
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
            image_quality=image_quality,
            processing_time_ms=inference_time_ms,
            survey_info=survey_info,
            prediction_type="Image"
        )
            
        # Generate automatic AI summary paragraph
        if len(species_counts) == 0:
            ai_summary = "No species detected above the selected confidence threshold."
        else:
            summary_parts = []
            unk_count = 0
            for sp_name, count in species_counts.items():
                if sp_name == "Unknown Species":
                    unk_count += count
                else:
                    summary_parts.append(f"{count} {sp_name} detected")
            
            if unk_count > 0:
                if unk_count == 1:
                    summary_parts.append("1 detection requires manual verification")
                else:
                    summary_parts.append(f"{unk_count} detections require manual verification")
            
            max_conf = max_confidence
            summary_text = ", ".join(summary_parts) + ". "
            summary_text += f"Overall confidence: {int(max_conf * 100)}%. "
            
            quality = "High" if max_conf >= 0.80 else ("Medium" if max_conf >= 0.60 else "Low")
            summary_text += f"Detection Quality: {quality}."
            
            behaviour = next((d.get("behaviour", {}).get("behaviour") for d in raw_detections if d.get("behaviour") and d.get("behaviour", {}).get("behaviour") != "Behaviour Unknown"), None)
            if behaviour:
                summary_text += f" Primary observed behaviour: {behaviour}."
            ai_summary = summary_text

        # Update image status to Analyzed and assign AI summary
        db_image.status = "Analyzed"
        db_image.ai_summary = ai_summary
        db.commit()
        db.refresh(db_image)
        
        # Attach detections list dynamically to the returned object
        db_image.detections = mapped_detections
        db_image.image_quality = image_quality
        db_image.biodiversity_metrics = biodiversity_metrics
        db_image.monitoring_report = monitoring_report
        db_image.ecosystem_health_score = ecosystem_health_score
        
    except Exception as e:
        db.rollback()
        logger.exception("YOLOv11 image analysis failed for upload id=%s", db_image.id)
        db_image.detections = []
        db_image.ai_summary = "No wildlife species detected due to telemetry processing exception."
        db_image.biodiversity_metrics = None
        db_image.monitoring_report = None
        db_image.ecosystem_health_score = None
    return db_image

@router.get("/debug-yolo")
def debug_yolo(db: Session = Depends(get_db)):
    from app.services.yolo_service import yolo_service
    from app.models.species import SpeciesProfile
    from app.models.upload import UploadedImage
    
    # 1. Check if model is loaded
    model_loaded = yolo_service._model is not None
    
    # Try resolving absolute path
    service_dir = os.path.dirname(os.path.abspath(yolo_service.__file__ if hasattr(yolo_service, "__file__") else __file__))
    backend_dir = os.path.dirname(os.path.dirname(service_dir))
    abs_model_path = os.path.join(backend_dir, "models", "best.pt")
    
    class_count = 0
    class_names = {}
    if model_loaded:
        class_count = len(yolo_service._model.names)
        class_names = yolo_service._model.names
        
    # 2. Grab the latest uploaded image
    last_img = db.query(UploadedImage).order_by(UploadedImage.id.desc()).first()
    
    raw_detections = []
    filtered_detections = []
    species_mapping = []
    last_image_filename = None
    
    if last_img:
        last_image_filename = os.path.basename(last_img.filepath)
        last_image_path = os.path.join(backend_dir, "uploads", "images", last_image_filename)
        
        if os.path.exists(last_image_path):
            try:
                # Force inference with low threshold to see raw outputs
                raw_detections = yolo_service.run_inference(last_image_path, conf_threshold=0.01)
                
                # Filtered detections at 0.10
                filtered_detections = [d for d in raw_detections if d["confidence"] >= 0.10]
                
                # Perform profile mapping details
                for det in filtered_detections:
                    raw_species = det["species"]
                    profile = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(raw_species)).first()
                    if not profile:
                        profile = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(f"%{raw_species}%")).first()
                        
                    mapping_status = "Matched" if profile else "Not Matched (Using Fallback)"
                    species_mapping.append({
                        "detected_class": raw_species,
                        "confidence": det["confidence"],
                        "mapping_status": mapping_status,
                        "db_profile_common_name": profile.common_name if profile else None,
                        "db_profile_scientific_name": profile.scientific_name if profile else None
                    })
            except Exception as e:
                raw_detections = [{"error": f"Inference execution failed: {str(e)}"}]
        else:
            raw_detections = [{"error": f"Image file not found on disk at: {last_image_path}"}]
            
    return {
        "model_loaded": model_loaded,
        "model_path": abs_model_path,
        "class_count": class_count,
        "class_names": class_names,
        "last_image_analyzed": last_image_filename,
        "raw_detections": raw_detections,
        "filtered_detections": filtered_detections,
        "species_mapping": species_mapping
    }

@router.post("/audio", response_model=UploadedAudioOut, status_code=status.HTTP_201_CREATED)
async def upload_audio(
    file: UploadFile = File(...),
    survey_id: Optional[int] = Form(None),
    monitoring_site_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify file extension
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {ext} not allowed. Supported audio types: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    # Create safe unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(AUDIO_DIR, unique_filename)
    
    # Save file to disk
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
    
    return db_audio

@router.get("/images", response_model=List[UploadedImageOut])
def get_images(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UploadedImage).order_by(UploadedImage.uploaded_at.desc()).all()

@router.get("/audios", response_model=List[UploadedAudioOut])
def get_audios(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UploadedAudio).order_by(UploadedAudio.uploaded_at.desc()).all()

@router.get("/prediction-history")
def get_prediction_history(include_unknown: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.prediction_history import PredictionHistory
    query = db.query(PredictionHistory)
    if not include_unknown:
        query = query.filter(
            PredictionHistory.species_predicted != "Unknown Species",
            (PredictionHistory.is_unknown == False) | (PredictionHistory.is_unknown.is_(None))
        )
    history = query.order_by(PredictionHistory.date.desc()).all()
    result = []
    for h in history:
        result.append({
            "id": h.id,
            "original_filename": h.original_filename,
            "stored_filename": h.stored_filename,
            "species_predicted": h.species_predicted,
            "confidence": h.confidence,
            "inference_time": h.inference_time,
            "username": h.user.username if h.user else "System",
            "date": h.date.isoformat() + "Z",
            "prediction_type": h.prediction_type,
            "linked_observation_id": h.linked_observation_id,
            "threshold_used": h.threshold_used
            ,"behaviour": h.behaviour
            ,"survey_id": h.observation.survey_id if h.observation else None
            ,"device_id": h.observation.device_id if h.observation else None
            ,"animal_call_detected": h.animal_call_detected
            ,"animal_call_category": h.animal_call_category
        })
    return result
