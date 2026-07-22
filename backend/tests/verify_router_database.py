import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Add backend folder to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_db, SessionLocal
from app.models.observation import Observation
from app.models.prediction_history import PredictionHistory
from app.models.upload import UploadedAudio
from app.services.yamnet_service import yamnet_service

def verify_database_insertion():
    print("Initializing Database connection...")
    db = SessionLocal()
    
    # Generate mock audio entry in DB
    print("Creating mock UploadedAudio record...")
    db_audio = UploadedAudio(
        survey_id=None,
        monitoring_site_id=None,
        filename="verify_test.wav",
        filepath="/uploads/audio/verify_test.wav",
        status="Pending Analysis"
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)
    print(f"Mock UploadedAudio created with ID: {db_audio.id}")
    
    # 1. Run mock YAMNet inference results
    # We will simulate a Mammal Vocalization trigger
    animal_call_detected = True
    animal_call_category = "Mammal Vocalization"
    confidence = 0.65
    
    # Create Observation record referencing this audio
    print("Creating mock Observation record...")
    obs = Observation(
        survey_id=1,  # Assume survey ID 1 exists (standard demo survey)
        monitoring_site_id=1,
        species_name="Mammal Vocalization",
        count=1,
        observation_type="Audio Sensor",
        notes="AI detected Mammal Vocalization via audio sensor analysis. Source: AI Generated.",
        status="Expert Validation Required",
        is_unknown=True,
        is_endangered=False,
        uploaded_audio_id=db_audio.id,
        animal_call_detected=animal_call_detected,
        animal_call_category=animal_call_category
    )
    db.add(obs)
    db.flush()
    print(f"Observation record created with ID: {obs.id}")
    
    # Create PredictionHistory record
    print("Creating mock PredictionHistory record...")
    pred_hist = PredictionHistory(
        original_filename="verify_test.wav",
        stored_filename="verify_test.wav",
        species_predicted="Mammal Vocalization",
        confidence=confidence,
        inference_time=120.0,
        user_id=1,
        prediction_type="Audio",
        linked_observation_id=obs.id,
        threshold_used=0.50,
        is_unknown=True,
        is_endangered=False,
        animal_call_detected=animal_call_detected,
        animal_call_category=animal_call_category
    )
    db.add(pred_hist)
    db.commit()
    print(f"PredictionHistory record created with ID: {pred_hist.id}")
    
    # 2. Query back and verify values are correctly stored
    print("\nVerifying database values...")
    queried_obs = db.query(Observation).filter(Observation.id == obs.id).first()
    print(f"Queried Observation ID: {queried_obs.id}")
    print(f"Observation.animal_call_detected: {queried_obs.animal_call_detected} (Expected: True)")
    print(f"Observation.animal_call_category: {queried_obs.animal_call_category} (Expected: Mammal Vocalization)")
    
    queried_pred = db.query(PredictionHistory).filter(PredictionHistory.id == pred_hist.id).first()
    print(f"Queried PredictionHistory ID: {queried_pred.id}")
    print(f"PredictionHistory.animal_call_detected: {queried_pred.animal_call_detected} (Expected: True)")
    print(f"PredictionHistory.animal_call_category: {queried_pred.animal_call_category} (Expected: Mammal Vocalization)")
    
    assert queried_obs.animal_call_detected == True, "Failed to verify Observation.animal_call_detected"
    assert queried_obs.animal_call_category == "Mammal Vocalization", "Failed to verify Observation.animal_call_category"
    assert queried_pred.animal_call_detected == True, "Failed to verify PredictionHistory.animal_call_detected"
    assert queried_pred.animal_call_category == "Mammal Vocalization", "Failed to verify PredictionHistory.animal_call_category"
    
    # 3. Clean up verify records
    print("\nCleaning up verification records...")
    db.delete(queried_pred)
    db.delete(queried_obs)
    db.delete(db_audio)
    db.commit()
    print("Database cleanup completed successfully!")
    print("Database verification passed successfully!")

if __name__ == "__main__":
    verify_database_insertion()
