"""
Automated Wildlife Monitoring Report Generation Service.
"""
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

REPORTS_DIR = os.path.join("uploads", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_wildlife_monitoring_report(
    filename: str,
    stored_filename: str,
    detections: List[Dict[str, Any]],
    biodiversity_metrics: Dict[str, Any],
    image_quality: Dict[str, Any] | None,
    processing_time_ms: float,
    survey_info: Dict[str, Any] | None = None,
    prediction_type: str = "Image"
) -> Dict[str, Any]:
    """
    Generate an automated wildlife monitoring report and export it as JSON.
    """
    species_list = []
    detection_counts = {}
    confidence_levels = {}
    recommendations = []
    
    for det in detections:
        sp = det.get("species_prediction") or det.get("species") or "Unknown Species"
        conf = det.get("confidence", 0.0)
        level = det.get("confidence_level", "LOW")
        
        if sp not in species_list:
            species_list.append(sp)
            
        detection_counts[sp] = detection_counts.get(sp, 0) + 1
        
        confidence_levels[sp] = confidence_levels.get(sp, [])
        confidence_levels[sp].append(conf)
        
        if level == "LOW" or sp == "Unknown Species":
            recommendations.append(
                f"Manual verification recommended for low confidence detection of {sp} (confidence: {conf:.0%})."
            )
            
    confidence_summary = {}
    for sp, confs in confidence_levels.items():
        confidence_summary[sp] = {
            "avg_confidence": round(sum(confs) / len(confs), 4),
            "max_confidence": round(max(confs), 4),
            "min_confidence": round(min(confs), 4)
        }
        
    endangered_list = []
    vulnerable_list = []
    for det in detections:
        profile = det.get("species_profile")
        if profile and isinstance(profile, dict):
            sp_name = profile.get("common_name") or det.get("species")
            iucn = str(profile.get("iucn_status") or "").lower().strip()
            if any(term in iucn for term in ["critically endangered", "endangered", "cr", "en"]):
                if sp_name not in endangered_list:
                    endangered_list.append(sp_name)
            elif any(term in iucn for term in ["vulnerable", "near threatened", "vu", "nt"]):
                if sp_name not in vulnerable_list:
                    vulnerable_list.append(sp_name)
                    
    conservation_summary = {
        "endangered_species": endangered_list,
        "vulnerable_species": vulnerable_list,
        "total_threatened_count": len(endangered_list) + len(vulnerable_list)
    }
    
    metadata = {
        "original_filename": filename,
        "stored_filename": stored_filename,
        "media_type": prediction_type,
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }
    
    project_info = survey_info or {
        "project_name": "WPIS Wildlife Monitoring Project",
        "description": "Automated species surveillance using YOLOv11 & BirdNET models",
        "site_id": None,
        "survey_id": None
    }
    
    report_data = {
        "project_information": project_info,
        "media_metadata": metadata,
        "species_list": species_list,
        "detection_counts": detection_counts,
        "confidence_levels": confidence_summary,
        "biodiversity_metrics": biodiversity_metrics,
        "conservation_summary": conservation_summary,
        "image_quality_assessment": image_quality or {"quality": "N/A", "blurriness": 0.0, "exposure": 0.0},
        "processing_time_ms": processing_time_ms,
        "manual_verification_recommendations": recommendations if recommendations else [
            "All detections classified with acceptable confidence. No manual verification required."
        ]
    }
    
    # Save as JSON on disk
    stored_name_no_ext, _ = os.path.splitext(stored_filename)
    report_filename = f"{stored_name_no_ext}_report.json"
    report_path = os.path.join(REPORTS_DIR, report_filename)
    
    try:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
    except Exception:
        pass
        
    return report_data
