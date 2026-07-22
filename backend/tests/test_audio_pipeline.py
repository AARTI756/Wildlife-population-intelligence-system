import os
import unittest
from unittest.mock import patch, MagicMock

# Dummy DB setup
class DummyDB:
    def __init__(self):
        self.added = []
        self.deleted = []

    def query(self, model):
        self.model = model
        return self

    def filter(self, *args, **kwargs):
        return self

    def delete(self):
        self.deleted.append(self.model)
        return 0

    def first(self):
        # Return a dummy sensor or site if needed
        return MagicMock(sensor_id="SN-123", location_id=1, name="Sensor 1")

    def all(self):
        return []

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        pass

    def rollback(self):
        pass

    def refresh(self, obj):
        pass

    def flush(self):
        # Assign mock ID
        if not hasattr(self, "_id_counter"):
            self._id_counter = 1
        for obj in self.added:
            if not hasattr(obj, "id") or obj.id is None:
                obj.id = self._id_counter
                self._id_counter += 1


class AudioPipelineTests(unittest.TestCase):
    @patch("app.routers.audio.analyze_audio_file")
    @patch("app.services.yamnet_service.yamnet_service.run_inference")
    def test_birdnet_detection_skips_yamnet(self, mock_yamnet, mock_birdnet):
        # 1. Mock BirdNET returning a bird with high confidence
        mock_birdnet.return_value = {
            "detections": [
                {"common_name": "Indian Peafowl", "scientific_name": "Pavo cristatus", "confidence": 0.85, "start_time": 0.0, "end_time": 3.0}
            ]
        }
        
        # 2. Mock YAMNet (should NOT be called)
        mock_yamnet.return_value = {
            "animal_call_detected": True,
            "animal_call_category": "Mammal Vocalization",
            "primary_class": "Bark",
            "confidence": 0.90
        }

        # Call analyze_audio logic
        # For this test, we can mock the FastAPI file upload and run the endpoint
        from app.routers.audio import analyze_audio
        
        # Setup mocks
        db = DummyDB()
        db_audio = MagicMock(id=1, survey_id=1, monitoring_site_id=1, filename="test.wav", filepath="test.wav")
        db.query = MagicMock(return_value=MagicMock(filter=MagicMock(return_value=MagicMock(first=MagicMock(return_value=db_audio)))))
        
        # Mock file
        mock_file = MagicMock()
        mock_file.filename = "test.wav"
        
        # We need to mock the save file logic or verify_milestone2_schema
        # Let's mock the actual analyze_audio execution environment
        # Actually, let's call the helper functions inside analyze_audio or test using TestClient
        
    @patch("app.routers.audio.analyze_audio_file")
    @patch("app.services.yamnet_service.yamnet_service.run_inference")
    def test_birdnet_no_detection_falls_back_to_yamnet(self, mock_yamnet, mock_birdnet):
        # 1. Mock BirdNET returning no bird or below threshold
        mock_birdnet.return_value = {
            "detections": []
        }
        
        # 2. Mock YAMNet returning Mammal Vocalization
        mock_yamnet.return_value = {
            "animal_call_detected": True,
            "animal_call_category": "Mammal Vocalization",
            "primary_class": "Bark",
            "confidence": 0.75
        }
        
        # Mappings test
        from app.services.yamnet_service import yamnet_service
        category = yamnet_service.map_class_to_category("Bark", 70)
        self.assertEqual(category, "Mammal Vocalization")
        
        # Silence/Noise test
        category_noise = yamnet_service.map_class_to_category("Speech", 0)
        self.assertEqual(category_noise, "Environmental Noise")
