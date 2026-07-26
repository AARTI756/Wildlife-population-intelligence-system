from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List
from collections import defaultdict

from app.models.observation import Observation
from app.models.monitoring import MonitoringSite

def calculate_population_analytics(db: Session) -> Dict[str, Any]:
    """
    Computes detailed population statistics using database observation logs.
    """
    # 1. Total Population Size (Sum of all counts)
    total_size = db.query(func.sum(Observation.count)).scalar() or 0
    
    # 2. Species Richness (Unique species count)
    species_richness = db.query(func.count(func.distinct(Observation.species_name))).scalar() or 0
    
    # 3. Population Density (Average count per site)
    site_count = db.query(func.count(MonitoringSite.id)).scalar() or 1
    population_density = round(total_size / site_count, 2)
    
    # 4. Species Frequency count
    all_obs = db.query(Observation.species_name, func.sum(Observation.count)).group_by(Observation.species_name).all()
    species_totals = {name: count for name, count in all_obs if name}
    
    # Sorted list of species by count descending
    sorted_species = sorted(species_totals.items(), key=lambda x: x[1], reverse=True)
    
    top_species = [{"species": name, "count": count} for name, count in sorted_species[:5]]
    rare_species = [{"species": name, "count": count} for name, count in sorted_species if count <= 5][:5]
    
    # 5. Monthly Trends (Sighting counts over previous 6 calendar months)
    # Get observations in last 180 days
    cutoff_date = datetime.utcnow() - timedelta(days=180)
    recent_obs = db.query(Observation.timestamp, Observation.count).filter(Observation.timestamp >= cutoff_date).all()
    
    month_counts = defaultdict(int)
    for obs in recent_obs:
        if obs.timestamp:
            month_str = obs.timestamp.strftime("%b")
            month_counts[month_str] += obs.count
            
    # Order months historically
    months_order = []
    for i in range(5, -1, -1):
        m = (datetime.utcnow() - timedelta(days=i*30)).strftime("%b")
        months_order.append(m)
        
    monthly_trends = [{"month": m, "count": month_counts[m]} for m in months_order]
    
    # 6. Observation Growth (Comparing past 30 days to the 30 days before that)
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    prev_60_days = now - timedelta(days=60)
    
    current_period = db.query(func.sum(Observation.count)).filter(Observation.timestamp >= last_30_days).scalar() or 0
    previous_period = db.query(func.sum(Observation.count)).filter(
        Observation.timestamp >= prev_60_days, 
        Observation.timestamp < last_30_days
    ).scalar() or 0
    
    if previous_period > 0:
        observation_growth = round(((current_period - previous_period) / previous_period) * 100.0, 1)
    else:
        observation_growth = 0.0
        
    # 7. Population Stability
    # Calculated as percentage inverse coefficient of monthly variation
    counts_list = [t["count"] for t in monthly_trends if t["count"] > 0]
    if len(counts_list) > 1:
        mean_val = sum(counts_list) / len(counts_list)
        variance = sum((x - mean_val) ** 2 for x in counts_list) / len(counts_list)
        std_dev = variance ** 0.5
        cv = std_dev / mean_val if mean_val > 0 else 0
        population_stability = round(max(0.0, min(100.0, (1.0 - cv) * 100.0)), 1)
    else:
        population_stability = 85.0 # Stable baseline default
        
    return {
        "population_size": total_size,
        "species_richness": species_richness,
        "population_density": population_density,
        "population_stability": population_stability,
        "observation_growth": observation_growth,
        "monthly_trends": monthly_trends,
        "top_species": top_species,
        "rare_species": rare_species
    }
