import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import func, desc, or_
from app.models.observation import Observation
from app.models.monitoring import Survey, MonitoringSite
from app.models.prediction_history import PredictionHistory
from app.models.species import SpeciesProfile

def get_state_from_location(location_str: str) -> str:
    """Helper to parse state name from a site location or monitoring location string."""
    if not location_str:
        return "Unknown Region"
    loc_lower = location_str.lower()
    if "uttarakhand" in loc_lower or "corbett" in loc_lower:
        return "Uttarakhand"
    if "west bengal" in loc_lower or "sundarbans" in loc_lower or "bengal" in loc_lower:
        return "West Bengal"
    if "kerala" in loc_lower or "wayanad" in loc_lower:
        return "Kerala"
    if "assam" in loc_lower or "kaziranga" in loc_lower:
        return "Assam"
    if "madhya pradesh" in loc_lower or "kanha" in loc_lower or "pench" in loc_lower:
        return "Madhya Pradesh"
    if "gujarat" in loc_lower or "gir" in loc_lower:
        return "Gujarat"
    if "karnataka" in loc_lower or "bandipur" in loc_lower:
        return "Karnataka"
    if "maharashtra" in loc_lower or "tadoba" in loc_lower:
        return "Maharashtra"
    if "rajasthan" in loc_lower or "ranthambore" in loc_lower:
        return "Rajasthan"
    
    parts = location_str.split(',')
    if len(parts) > 1:
        candidate = parts[-1].strip()
        if candidate and len(candidate) < 50:
            return candidate.title()
    return "Other Reserve"

def get_species_profile_map(db) -> Dict[str, tuple]:
    """Build a case-insensitive map of common and scientific names to (common_name, scientific_name)."""
    try:
        profiles = db.query(SpeciesProfile).all()
        name_map = {}
        for p in profiles:
            common = p.common_name.strip()
            scientific = p.scientific_name.strip()
            name_map[common.lower()] = (common, scientific)
            name_map[scientific.lower()] = (common, scientific)
        return name_map
    except Exception:
        return {}

def get_filtered_observations(
    db, 
    survey_id: Optional[int] = None, 
    site_id: Optional[int] = None, 
    species: Optional[str] = None, 
    habitat: Optional[str] = None, 
    date_from: Optional[datetime] = None, 
    date_to: Optional[datetime] = None,
    select_entity=Observation
):
    """Core helper function to apply filters consistently across database queries."""
    query = db.query(select_entity)
    
    if habitat is not None:
        query = query.join(Survey, Observation.survey_id == Survey.id)
        
    query = query.filter(
        Observation.species_name != "Unknown Species",
        Observation.species_name != "Species Requires Verification",
        (Observation.is_unknown == False) | (Observation.is_unknown.is_(None))
    )
    
    if survey_id is not None:
        query = query.filter(Observation.survey_id == survey_id)
    if site_id is not None:
        query = query.filter(Observation.monitoring_site_id == site_id)
    if species is not None:
        query = query.filter(Observation.species_name.ilike(f"%{species}%"))
    if habitat is not None:
        query = query.filter(Survey.habitat_type.ilike(f"%{habitat}%"))
    if date_from is not None:
        query = query.filter(Observation.timestamp >= date_from)
    if date_to is not None:
        query = query.filter(Observation.timestamp <= date_to)
        
    return query

def estimate_population(db, **filters) -> int:
    """Estimate total population across all observed species based on detection rates and confidence."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    if not observations:
        return 0

    total_surveys = db.query(Survey).count()
    species_map = get_species_profile_map(db)
    
    # Group by standardized common name
    species_obs = defaultdict(list)
    for o in observations:
        if not o.species_name:
            continue
        lookup = species_map.get(o.species_name.lower().strip())
        std_name = lookup[0] if lookup else o.species_name
        species_obs[std_name].append(o)
        
    # Get average confidence per species
    conf_query = db.query(Observation.species_name, func.avg(PredictionHistory.confidence)).join(
        PredictionHistory, Observation.id == PredictionHistory.linked_observation_id
    ).group_by(Observation.species_name)
    raw_conf_dict = {row[0]: float(row[1]) for row in conf_query.all() if row[0]}
    
    # Normalize confidence dictionary to standardized keys
    conf_dict = {}
    for raw_name, val in raw_conf_dict.items():
        lookup = species_map.get(raw_name.lower().strip())
        std_key = lookup[0] if lookup else raw_name
        conf_dict[std_key] = val
    
    estimated_total = 0
    for sp_name, obs_list in species_obs.items():
        total_observed = sum(o.count for o in obs_list)
        avg_conf = conf_dict.get(sp_name, 0.82)
        
        # Abundance estimation formula
        detection_rate = len(obs_list) / max(total_surveys, 1)
        p_detect = avg_conf * (1.0 - math.exp(-detection_rate))
        p_detect = max(min(p_detect, 0.90), 0.20)
        
        estimated_total += int(math.ceil(total_observed / p_detect))
        
    return estimated_total

def calculate_population_density(db, **filters) -> float:
    """Calculate the average density of individuals per square kilometer."""
    est_pop = estimate_population(db, **filters)
    if est_pop == 0:
        return 0.0
        
    # Find unique active sites
    obs_query = get_filtered_observations(db, **filters)
    site_ids = {o.monitoring_site_id for o in obs_query.all() if o.monitoring_site_id is not None}
    
    # Assume 12 sq km per active monitoring site area
    active_sites_count = len(site_ids)
    estimated_area = active_sites_count * 12.0
    
    if estimated_area == 0:
        total_sites = db.query(MonitoringSite).count()
        estimated_area = total_sites * 12.0
        
    return round(est_pop / max(estimated_area, 1.0), 2)

def calculate_species_richness(db, **filters) -> int:
    """Calculate the count of unique species observed."""
    query = get_filtered_observations(db, select_entity=Observation, **filters)
    species_map = get_species_profile_map(db)
    
    # Standardize unique species set
    species = set()
    for o in query.all():
        if o.species_name:
            lookup = species_map.get(o.species_name.lower().strip())
            std_name = lookup[0] if lookup else o.species_name
            species.add(std_name)
    return len(species)

def calculate_population_growth(db, **filters) -> Optional[float]:
    """Calculate population growth rate (%) by comparing current month vs previous month. 
    Clamps unrealistic numbers and returns None (Insufficient data) if previous count is too small."""
    date_to = filters.get("date_to") or datetime.utcnow()
    
    mid_date = date_to - timedelta(days=30)
    start_date = mid_date - timedelta(days=30)
    
    current_filters = filters.copy()
    current_filters["date_from"] = mid_date
    current_filters["date_to"] = date_to
    
    prev_filters = filters.copy()
    prev_filters["date_from"] = start_date
    prev_filters["date_to"] = mid_date
    
    current_pop = estimate_population(db, **current_filters)
    prev_pop = estimate_population(db, **prev_filters)
    
    # Display "Insufficient historical data" when the previous period has very few observations
    if prev_pop < 5:
        return None
        
    growth = ((current_pop - prev_pop) / prev_pop) * 100
    
    # Clamp unrealistic population growth percentages to a meaningful range (-100% to +150%)
    clamped_growth = max(min(growth, 150.0), -100.0)
    return round(clamped_growth, 2)

def calculate_detection_rate(db, **filters) -> float:
    """Calculate species detection rate as average observations per survey."""
    obs_query = get_filtered_observations(db, **filters)
    obs_count = obs_query.count()
    total_surveys = db.query(func.count(Survey.id)).scalar() or 1
    return min(round((obs_count / max(total_surveys, 1)) * 100, 1), 100.0)

def calculate_observation_coverage(db, **filters) -> float:
    """Calculate observation coverage as percentage of monitoring sites with observations."""
    obs_query = get_filtered_observations(db, **filters)
    observed_site_ids = {o.monitoring_site_id for o in obs_query.all() if o.monitoring_site_id is not None}
    
    total_sites = db.query(func.count(MonitoringSite.id)).scalar() or 1
    return min(round((len(observed_site_ids) / max(total_sites, 1)) * 100, 1), 100.0)

def calculate_distribution_statistics(db, **filters) -> Dict[str, List[Dict[str, Any]]]:
    """Compile observations aggregated by Survey, Site, Habitat, State, Protected Area and Species."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    
    site_dict = {site.id: site for site in db.query(MonitoringSite).all()}
    survey_dict = {survey.id: survey for survey in db.query(Survey).all()}
    species_map = get_species_profile_map(db)
    
    by_survey = defaultdict(int)
    by_site = defaultdict(int)
    by_habitat = defaultdict(int)
    by_state = defaultdict(int)
    by_protected = defaultdict(int)
    by_species = defaultdict(int)
    
    for o in observations:
        if not o.species_name:
            continue
        lookup = species_map.get(o.species_name.lower().strip())
        std_name = lookup[0] if lookup else o.species_name
        
        by_species[std_name] += o.count
        
        srv = survey_dict.get(o.survey_id)
        srv_name = srv.name if srv else "Unspecified Survey"
        by_survey[srv_name] += o.count
        
        hab = srv.habitat_type if srv else "Unspecified Habitat"
        by_habitat[hab] += o.count
        
        site = site_dict.get(o.monitoring_site_id)
        is_prot = srv.protected_area if srv else False
        if site:
            is_prot = is_prot or site.protected_area
            
        by_protected["Protected Area" if is_prot else "Standard Area"] += o.count
        
        site_name = site.name if site else "Unspecified Site"
        by_site[site_name] += o.count
        
        loc = site.location if site else (srv.monitoring_location if srv else "")
        state = get_state_from_location(loc)
        by_state[state] += o.count
        
    return {
        "by_survey": [{"name": k, "count": v} for k, v in by_survey.items()],
        "by_site": [{"name": k, "count": v} for k, v in by_site.items()],
        "by_habitat": [{"name": k, "count": v} for k, v in by_habitat.items()],
        "by_state": [{"name": k, "count": v} for k, v in by_state.items()],
        "by_protected": [{"name": k, "count": v} for k, v in by_protected.items()],
        "by_species": [{"name": k, "count": v} for k, v in by_species.items()]
    }

def get_population_overview(db, **filters) -> Dict[str, Any]:
    """Retrieve consolidated high-level population stats."""
    total_obs = get_filtered_observations(db, **filters).count()
    est_pop = estimate_population(db, **filters)
    density = calculate_population_density(db, **filters)
    richness = calculate_species_richness(db, **filters)
    growth = calculate_population_growth(db, **filters)
    coverage = calculate_observation_coverage(db, **filters)
    
    # Calculate average confidence
    conf_query = get_filtered_observations(db, select_entity=PredictionHistory.confidence, **filters).join(
        Observation, Observation.id == PredictionHistory.linked_observation_id
    )
    conf_list = [row[0] for row in conf_query.all() if row[0] is not None]
    avg_conf = sum(conf_list) / len(conf_list) if conf_list else 0.84
    
    return {
        "total_estimated_population": est_pop,
        "average_density": density,
        "total_species_richness": richness,
        "average_growth_rate": growth,
        "average_observation_coverage": coverage,
        "total_observations": total_obs,
        "average_confidence": round(avg_conf, 4)
    }

def get_species_metrics(db, **filters) -> List[Dict[str, Any]]:
    """Retrieve database metrics details for each monitored species, standardizing to Common Name 
    and returning Scientific Name underneath. Results sorted by latest observation date desc."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    if not observations:
        return []
        
    species_map = get_species_profile_map(db)
    
    # Group observations by standardized common name
    species_obs = defaultdict(list)
    for o in observations:
        if not o.species_name:
            continue
        lookup = species_map.get(o.species_name.lower().strip())
        std_name = lookup[0] if lookup else o.species_name
        species_obs[std_name].append(o)
        
    total_surveys = db.query(Survey).count()
    total_sites = db.query(MonitoringSite).count()
    
    # Bulk confidence query
    conf_query = db.query(Observation.species_name, func.avg(PredictionHistory.confidence)).join(
        PredictionHistory, Observation.id == PredictionHistory.linked_observation_id
    ).group_by(Observation.species_name)
    raw_conf_dict = {row[0]: float(row[1]) for row in conf_query.all() if row[0]}
    
    conf_dict = {}
    for raw_name, val in raw_conf_dict.items():
        lookup = species_map.get(raw_name.lower().strip())
        std_key = lookup[0] if lookup else raw_name
        conf_dict[std_key] = val
    
    latest_query = db.query(Observation.species_name, func.max(Observation.timestamp)).group_by(Observation.species_name)
    raw_latest_dict = {row[0]: row[1] for row in latest_query.all() if row[0]}
    
    latest_dict = {}
    for raw_name, val in raw_latest_dict.items():
        lookup = species_map.get(raw_name.lower().strip())
        std_key = lookup[0] if lookup else raw_name
        if std_key not in latest_dict or val > latest_dict[std_key]:
            latest_dict[std_key] = val
    
    site_count_query = db.query(Observation.species_name, func.count(func.distinct(Observation.monitoring_site_id))).group_by(Observation.species_name)
    raw_site_count_dict = {row[0]: row[1] for row in site_count_query.all() if row[0]}
    
    site_count_dict = defaultdict(int)
    for raw_name, val in raw_site_count_dict.items():
        lookup = species_map.get(raw_name.lower().strip())
        std_key = lookup[0] if lookup else raw_name
        site_count_dict[std_key] += val

    survey_count_query = db.query(Observation.species_name, func.count(func.distinct(Observation.survey_id))).group_by(Observation.species_name)
    raw_survey_count_dict = {row[0]: row[1] for row in survey_count_query.all() if row[0]}
    
    survey_count_dict = defaultdict(int)
    for raw_name, val in raw_survey_count_dict.items():
        lookup = species_map.get(raw_name.lower().strip())
        std_key = lookup[0] if lookup else raw_name
        survey_count_dict[std_key] += val
    
    results = []
    for sp_name, obs_list in species_obs.items():
        obs_count = len(obs_list)
        total_observed = sum(o.count for o in obs_list)
        avg_conf = conf_dict.get(sp_name, None)
        
        if avg_conf is None:
            valid_reids = [o.reidentification_confidence for o in obs_list if o.reidentification_confidence is not None]
            avg_conf = sum(valid_reids) / len(valid_reids) if valid_reids else 0.83
            
        sp_surveys = survey_count_dict.get(sp_name, 1)
        detection_rate = obs_count / max(total_surveys, 1)
        p_detect = avg_conf * (1.0 - math.exp(-detection_rate))
        p_detect = max(min(p_detect, 0.90), 0.20)
        
        est_pop = int(math.ceil(total_observed / p_detect))
        
        sp_sites = site_count_dict.get(sp_name, 1)
        estimated_area = sp_sites * 12.0
        density = round(est_pop / max(estimated_area, 1.0), 2)
        
        coverage = min(round((sp_sites / max(total_sites, 1)) * 100, 1), 100.0)
        det_freq = min(round((obs_count / max(total_surveys, 1)) * 100, 1), 100.0)
        
        # Get scientific name from map
        lookup = species_map.get(sp_name.lower())
        scientific_name = lookup[1] if lookup else None
        
        results.append({
            "species_name": sp_name,
            "scientific_name": scientific_name,
            "estimated_population": est_pop,
            "population_density": density,
            "observation_count": obs_count,
            "detection_frequency": det_freq,
            "observation_coverage": coverage,
            "species_richness": 1,
            "average_confidence": round(avg_conf, 2),
            "survey_count": sp_surveys,
            "monitoring_site_count": sp_sites,
            "latest_observation": latest_dict.get(sp_name).isoformat() if latest_dict.get(sp_name) else None
        })
        
    # Sort assessment table by Latest Observation (newest first)
    results.sort(key=lambda x: x["latest_observation"] or "", reverse=True)
    
    return results

def get_population_trends(db, **filters) -> Dict[str, Any]:
    """Retrieve time-series trends (daily, weekly, monthly) and growth metrics."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    
    growth = calculate_population_growth(db, **filters)
    
    daily = Counter()
    weekly = Counter()
    monthly = Counter()
    
    for o in observations:
        if not o.timestamp:
            continue
        day_str = o.timestamp.strftime("%Y-%m-%d")
        week_str = o.timestamp.strftime("%Y-W%U")
        month_str = o.timestamp.strftime("%Y-%m")
        
        daily[day_str] += o.count
        weekly[week_str] += o.count
        monthly[month_str] += o.count
        
    daily_list = [{"date": k, "count": v} for k, v in sorted(daily.items())]
    weekly_list = [{"week": k, "count": v} for k, v in sorted(weekly.items())]
    monthly_list = [{"month": k, "count": v} for k, v in sorted(monthly.items())]
    
    growth_rate_pct = None
    decline_rate_pct = None
    stable_trend = True
    
    if growth is not None:
        growth_rate_pct = max(growth, 0.0) if growth > 0 else 0.0
        decline_rate_pct = abs(growth) if growth < 0 else 0.0
        stable_trend = abs(growth) <= 2.0
    
    return {
        "growth_rate_pct": growth_rate_pct,
        "decline_rate_pct": decline_rate_pct,
        "stable_trend": stable_trend,
        "daily": daily_list,
        "weekly": weekly_list,
        "monthly": monthly_list
    }

def get_site_densities(db, **filters) -> List[Dict[str, Any]]:
    """Retrieve densities and coordinates suitable for population maps."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    
    site_obs = defaultdict(list)
    for o in observations:
        if o.monitoring_site_id is not None:
            site_obs[o.monitoring_site_id].append(o)
            
    site_lookup = {site.id: site for site in db.query(MonitoringSite).all()}
    
    results = []
    for site_id, o_list in site_obs.items():
        site = site_lookup.get(site_id)
        if not site:
            continue
            
        sp_counts = defaultdict(int)
        for o in o_list:
            sp_counts[o.species_name] += o.count
            
        site_est_pop = 0
        for sp_name, obs_count in sp_counts.items():
            site_est_pop += int(math.ceil(obs_count / 0.8))
            
        area = 12.0
        density = round(site_est_pop / area, 2)
        
        results.append({
            "site_id": site.id,
            "site_name": site.name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "location": site.location,
            "estimated_population": site_est_pop,
            "density": density,
            "protected_area": site.protected_area
        })
        
    return results

def get_richness_stats(db, **filters) -> List[Dict[str, Any]]:
    """Retrieve species richness counts by monitoring site, standardized by Common Name."""
    obs_query = get_filtered_observations(db, **filters)
    observations = obs_query.all()
    species_map = get_species_profile_map(db)
    
    site_species = defaultdict(set)
    for o in observations:
        if o.monitoring_site_id is not None and o.species_name:
            lookup = species_map.get(o.species_name.lower().strip())
            std_name = lookup[0] if lookup else o.species_name
            site_species[o.monitoring_site_id].add(std_name)
            
    site_lookup = {site.id: site for site in db.query(MonitoringSite).all()}
    
    results = []
    for site_id, species_set in site_species.items():
        site = site_lookup.get(site_id)
        if not site:
            continue
        results.append({
            "site_id": site.id,
            "site_name": site.name,
            "richness": len(species_set)
        })
    return results
