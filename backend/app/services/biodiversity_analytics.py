"""Reusable aggregation layer for future biodiversity visualisations."""
from collections import Counter
from sqlalchemy import func
from app.models.observation import Observation
from app.models.monitoring import Survey, MonitoringSite

THREATENED = {"Vulnerable", "Endangered", "Critically Endangered"}

def build_biodiversity_summary(db, survey_id=None, monitoring_site_id=None, include_unknown=False):
    query = db.query(Observation)
    if not include_unknown:
        query = query.filter(
            Observation.species_name != "Unknown Species",
            Observation.species_name != "Species Requires Verification",
            (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
        )
    if survey_id:
        query = query.filter(Observation.survey_id == survey_id)
    if monitoring_site_id:
        query = query.filter(Observation.monitoring_site_id == monitoring_site_id)
    observations = query.all()
    species = [o.species_name for o in observations if o.species_name]
    frequency = Counter(species)
    endangered_count = sum(1 for o in observations if o.is_endangered)
    sites = {o.monitoring_site_id for o in observations if o.monitoring_site_id is not None}
    total = sum(frequency.values())
    proportions = [count / total for count in frequency.values()] if total else []
    import math
    shannon = -sum(p * math.log(p) for p in proportions if p)
    simpson = 1 - sum(p * p for p in proportions)
    monthly = Counter(o.timestamp.strftime("%Y-%m") for o in observations if o.timestamp)
    habitats = Counter()
    site_lookup = {site.id: site for site in db.query(MonitoringSite).all()}
    for observation in observations:
        survey = db.get(Survey, observation.survey_id) if observation.survey_id else None
        habitats[survey.habitat_type if survey else "Unspecified"] += 1
    heatmap = [{"site_id": sid, "site_name": site_lookup[sid].name if sid in site_lookup else "Unknown site", "latitude": site_lookup[sid].latitude if sid in site_lookup else None, "longitude": site_lookup[sid].longitude if sid in site_lookup else None, "detections": sum(1 for o in observations if o.monitoring_site_id == sid)} for sid in sites]
    return {
        "species_richness": len(frequency),
        "species_frequency": [{"species": name, "observations": count} for name, count in frequency.most_common()],
        "endangered_species_count": endangered_count,
        "observation_density": round(len(observations) / max(len(sites), 1), 2),
        "shannon_diversity_index": round(shannon, 4),
        "simpson_diversity_index": round(simpson, 4),
        "habitat_utilization": [{"habitat": key, "observations": value} for key, value in habitats.items()],
        "population_trend": [{"month": key, "detections": value} for key, value in sorted(monthly.items())],
        "monthly_detections": [{"month": key, "detections": value} for key, value in sorted(monthly.items())],
        "detection_heatmap": heatmap,
        "camera_trap_statistics": sum(1 for o in observations if o.observation_type == "Camera Trap"),
        "acoustic_statistics": sum(1 for o in observations if o.observation_type == "Audio Sensor"),
        "observation_count": len(observations),
    }


def compute_biodiversity_metrics(detections: list[dict]) -> dict:
    """
    Compute biodiversity metrics (Shannon, Simpson, richness, threat counts) from detection outputs.
    """
    import math
    species_list = []
    endangered_count = 0
    vulnerable_count = 0
    least_concern_count = 0
    
    for det in detections:
        sp = det.get("species_prediction") or det.get("species")
        if not sp or sp == "Unknown Species":
            continue
            
        species_list.append(sp.lower().strip())
        
        # Check profile status
        profile = det.get("species_profile")
        if profile and isinstance(profile, dict):
            iucn = str(profile.get("iucn_status") or "").lower().strip()
            if any(term in iucn for term in ["critically endangered", "endangered", "cr", "en"]):
                endangered_count += 1
            elif any(term in iucn for term in ["vulnerable", "near threatened", "vu", "nt"]):
                vulnerable_count += 1
            elif any(term in iucn for term in ["least concern", "lc"]):
                least_concern_count += 1
            else:
                least_concern_count += 1
        else:
            least_concern_count += 1
            
    total_animals = len(species_list)
    unique_species = list(set(species_list))
    species_richness = len(unique_species)
    
    if total_animals > 0:
        counts = {}
        for sp in species_list:
            counts[sp] = counts.get(sp, 0) + 1
        proportions = [count / total_animals for count in counts.values()]
        shannon = -sum(p * math.log(p) for p in proportions if p > 0)
        simpson = 1 - sum(p * p for p in proportions)
    else:
        shannon = 0.0
        simpson = 0.0
        
    conservation_summary = {
        "endangered": endangered_count,
        "vulnerable": vulnerable_count,
        "least_concern": least_concern_count
    }
    
    return {
        "total_animals_detected": total_animals,
        "unique_species_detected": unique_species,
        "species_richness": species_richness,
        "shannon_diversity_index": round(shannon, 4),
        "simpson_diversity_index": round(simpson, 4),
        "endangered_species_count": endangered_count,
        "vulnerable_species_count": vulnerable_count,
        "least_concern_count": least_concern_count,
        "conservation_priority_summary": conservation_summary
    }

