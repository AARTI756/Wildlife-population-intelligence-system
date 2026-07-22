"""
Prediction Formatter Service to standardize prediction response formats.
"""
from typing import Dict, Any, List
from app.services.confidence_service import estimate_confidence

def format_prediction_response(
    species_name: str,
    confidence: float,
    bbox: List[float] | None,
    profile: Dict[str, Any] | None,
    image_quality: Dict[str, Any] | None = None,
    processing_time_ms: float = 0.0
) -> Dict[str, Any]:
    """
    Format prediction dictionary based on confidence levels.
    """
    conf_level = estimate_confidence(confidence)
    
    if conf_level == "UNKNOWN":
        return {
            "species_prediction": "Unknown Species",
            "confidence": confidence,
            "confidence_level": "UNKNOWN",
            "status": "Manual Verification Required",
            "species_profile": None,
            "bounding_boxes": [bbox] if bbox else [],
            "recommendation": "Unable to confidently identify the detected wildlife."
        }
        
    # Check if profile is valid and found
    is_known = profile is not None and not profile.get("profile_not_found", False)
    status_str = "Likely Species" if conf_level == "LOW" else ("Known Species" if is_known else "Unknown Species")
    recommendation_str = "Low confidence prediction. Manual verification is recommended." if conf_level == "LOW" else ""
    
    return {
        "species_prediction": species_name,
        "confidence": confidence,
        "confidence_level": conf_level,
        "status": status_str,
        "species_profile": profile if is_known else None,
        "bounding_boxes": [bbox] if bbox else [],
        "image_quality": image_quality,
        "processing_time": processing_time_ms,
        "recommendation": recommendation_str
    }
