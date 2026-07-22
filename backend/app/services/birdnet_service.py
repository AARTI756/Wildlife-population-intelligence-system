"""BirdNET inference with explicit preprocessing and actionable failures."""
import logging
import os
import tempfile
from datetime import datetime
import librosa
import numpy as np
import soundfile as sf
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

logger = logging.getLogger(__name__)
_analyzer = None

class BirdNETError(RuntimeError):
    """Base inference failure presented to the API without concealing the cause."""

class BirdNETModelError(BirdNETError): pass
class AudioPreprocessingError(BirdNETError): pass
class BirdNETPredictionError(BirdNETError): pass

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        try:
            logger.info("Loading BirdNET analyzer and labels")
            _analyzer = Analyzer()
        except Exception as exc:
            logger.exception("BirdNET model/label initialization failed")
            raise BirdNETModelError("BirdNET model or labels could not be loaded") from exc
    return _analyzer

def preprocess_audio(file_path: str) -> str:
    """Create a 48 kHz mono WAV, removing only leading/trailing silence."""
    try:
        audio, _ = librosa.load(file_path, sr=48000, mono=True)
        if audio.size == 0:
            raise ValueError("audio contains no samples")
        audio, _ = librosa.effects.trim(audio, top_db=45)
        if audio.size == 0:
            raise ValueError("audio contains only silence")
        peak = float(np.max(np.abs(audio)))
        if peak > 0:
            audio = np.clip(audio * min(0.95 / peak, 8.0), -1.0, 1.0)
        handle = tempfile.NamedTemporaryFile(prefix="wpis_birdnet_", suffix=".wav", delete=False)
        handle.close()
        sf.write(handle.name, audio, 48000, subtype="PCM_16")
        logger.info("Prepared BirdNET audio: mono 48kHz, %.2fs", len(audio) / 48000)
        return handle.name
    except Exception as exc:
        logger.exception("BirdNET audio preprocessing failed for %s", file_path)
        raise AudioPreprocessingError(f"Audio preprocessing failed: {exc}") from exc

def analyze_audio_file(file_path: str, latitude: float = None, longitude: float = None, date: datetime = None) -> dict:
    analyzer = get_analyzer()
    processed_path = preprocess_audio(file_path)
    try:
        recording = Recording(analyzer, processed_path, lat=latitude, lon=longitude, date=date, min_conf=0.20)
        recording.analyze()
        detections = [{
            "common_name": d.get("common_name", "Unknown"),
            "scientific_name": d.get("scientific_name", "Unknown"),
            "confidence": float(d.get("confidence", 0.0)),
            "start_time": float(d.get("start_time", 0.0)),
            "end_time": float(d.get("end_time", 0.0)),
        } for d in recording.detections]
        logger.info("BirdNET completed: %d detections", len(detections))
        return {"detections": detections, "preprocessed": True}
    except BirdNETError:
        raise
    except Exception as exc:
        logger.exception("BirdNET prediction failed after preprocessing")
        raise BirdNETPredictionError(f"BirdNET prediction failed: {exc}") from exc
    finally:
        try:
            os.remove(processed_path)
        except OSError:
            logger.warning("Could not remove BirdNET temporary file %s", processed_path)
