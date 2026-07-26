from typing import Dict, Any, Optional

def compute_ecosystem_health_score(
    biodiversity_metrics: Optional[Dict[str, Any]] = None,
    observation_statistics: Optional[Dict[str, Any]] = None,
    habitat_quality: Optional[Dict[str, Any]] = None,
    environmental_conditions: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes a weighted ecosystem health score based on species diversity, population stability,
    habitat quality, endangered species status, and environmental conditions.
    
    Weights:
      - Species Diversity: 30%
      - Population Stability: 25%
      - Habitat Quality: 20%
      - Endangered Species Status: 15%
      - Environmental Conditions: 10%
    """
    
    # 1. Species Diversity (30%)
    # Base diversity on Shannon index, evenness, and richness
    if biodiversity_metrics:
        richness = biodiversity_metrics.get("species_richness", 0)
        shannon = biodiversity_metrics.get("shannon_index", 0.0)
        evenness = biodiversity_metrics.get("species_evenness", 0.0)
        
        # Scale indices to 0-100 range
        shannon_score = min(100.0, (shannon / 3.5) * 100.0) if shannon > 0 else 70.0
        evenness_score = evenness * 100.0 if evenness > 0 else 75.0
        richness_score = min(100.0, richness * 8.0) if richness > 0 else 60.0
        
        species_diversity = int(0.4 * shannon_score + 0.3 * evenness_score + 0.3 * richness_score)
    else:
        species_diversity = 75  # Safe default

    # 2. Population Stability (25%)
    # Base stability on detection density and historical changes
    if observation_statistics:
        trend = observation_statistics.get("trend", "Stable")
        count = observation_statistics.get("total_count", 0)
        
        trend_multipliers = {
            "Increasing": 95,
            "Stable": 85,
            "Fluctuating": 70,
            "Decreasing": 45
        }
        stability_base = trend_multipliers.get(trend, 80)
        count_bonus = min(10, count // 5)
        population_stability = min(100, int(stability_base + count_bonus))
    else:
        population_stability = 80  # Safe default

    # 3. Habitat Quality (20%)
    if habitat_quality:
        habitat_quality_val = habitat_quality.get("score") or habitat_quality.get("quality_score")
        if habitat_quality_val is not None:
            habitat_quality_score = int(habitat_quality_val)
        else:
            veg_index = habitat_quality.get("ndvi") or habitat_quality.get("vegetation_density", 0.6)
            habitat_quality_score = int(veg_index * 100.0)
    else:
        habitat_quality_score = 82  # Safe default

    # 4. Endangered Species Status (15%)
    # Score is higher if there are no critically endangered species, or if their populations are protected
    if biodiversity_metrics and biodiversity_metrics.get("has_threatened", False):
        endangered_score = 65  # Lower score indicates concern
    else:
        endangered_score = 90  # High score if no immediate threatened species alarm is raised

    # 5. Environmental Conditions (10%)
    if environmental_conditions:
        env_score = environmental_conditions.get("score") or environmental_conditions.get("quality_score")
        if env_score is not None:
            environmental_conditions_score = int(env_score)
        else:
            temp = environmental_conditions.get("temperature", 25)
            humidity = environmental_conditions.get("humidity", 60)
            # Penalize extreme conditions
            temp_penalty = max(0, abs(temp - 24) - 10) * 2
            humidity_penalty = max(0, abs(humidity - 50) - 30) * 0.5
            environmental_conditions_score = max(0, min(100, int(90 - temp_penalty - humidity_penalty)))
    else:
        environmental_conditions_score = 85  # Safe default

    # Calculate overall weighted score
    overall_score = round(
        0.30 * species_diversity +
        0.25 * population_stability +
        0.20 * habitat_quality_score +
        0.15 * endangered_score +
        0.10 * environmental_conditions_score,
        1
    )

    # Determine status
    if overall_score >= 90:
        status = "Excellent"
    elif overall_score >= 75:
        status = "Healthy"
    elif overall_score >= 60:
        status = "Moderate Concern"
    elif overall_score >= 40:
        status = "Vulnerable"
    else:
        status = "Critical"

    return {
        "overall_score": overall_score,
        "status": status,
        "component_scores": {
            "species_diversity": species_diversity,
            "population_stability": population_stability,
            "habitat_quality": habitat_quality_score,
            "endangered_species": endangered_score,
            "environmental_conditions": environmental_conditions_score
        }
    }
