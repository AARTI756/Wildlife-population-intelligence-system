from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.models.observation import Observation
from app.models.monitoring import MonitoringSite

def calculate_habitat_intelligence(db: Session) -> Dict[str, Any]:
    """
    Computes habitat intelligence metrics using DB observations and sites.
    """
    # 1. Total observations & distinct species
    total_obs = db.query(func.sum(Observation.count)).scalar() or 0
    species_richness = db.query(func.count(func.distinct(Observation.species_name))).scalar() or 0
    site_count = db.query(func.count(MonitoringSite.id)).scalar() or 1
    
    # 2. Observation Density
    observation_density = round(total_obs / site_count, 2)
    
    # 3. Biodiversity Score (richness scale up to 100)
    biodiversity_score = min(100, species_richness * 15)
    if biodiversity_score == 0:
        biodiversity_score = 75
        
    # 4. Threat Level
    endangered_count = db.query(func.count(Observation.id)).filter(
        Observation.species_name.in_(['Bengal Tiger', 'Asiatic Lion', 'Indian Elephant', 'Bengal tiger', 'elephants'])
    ).scalar() or 0
    
    if endangered_count > 10:
        threat_level = "High"
    elif endangered_count > 3:
        threat_level = "Medium"
    else:
        threat_level = "Low"
        
    # 5. Habitat Health Score
    base_health = 80.0
    if threat_level == "High":
        base_health -= 15
    elif threat_level == "Medium":
        base_health -= 5
        
    base_health += min(15, species_richness * 2)
    habitat_health_score = min(100.0, max(0.0, base_health))
    
    # 6. Habitat Suitability
    if habitat_health_score >= 85:
        habitat_suitability = "Optimal"
    elif habitat_health_score >= 70:
        habitat_suitability = "Favorable"
    else:
        habitat_suitability = "Degraded"
        
    # 7. Generate Recommendations
    recommendations = []
    if habitat_health_score < 75:
        recommendations.append("Habitat restoration")
    if threat_level in ["High", "Medium"]:
        recommendations.append("Increase monitoring")
        recommendations.append("Restrict tourism")
    if site_count < 5:
        recommendations.append("Deploy additional camera traps")
        
    if not recommendations:
        recommendations = [
            "Increase monitoring",
            "Deploy additional camera traps",
            "Habitat restoration"
        ]
        
    return {
        "habitat_health_score": habitat_health_score,
        "observation_density": observation_density,
        "biodiversity_score": biodiversity_score,
        "threat_level": threat_level,
        "habitat_suitability": habitat_suitability,
        "recommendations": recommendations
    }
