import sys
import os

# Adjust sys.path to include the backend directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/wpis"

try:
    from app.database.connection import SessionLocal
    db = SessionLocal()
    from app.models.observation import Observation
    all_obs = db.query(Observation).all()
    print("Fetched all observations:", len(all_obs))
    
    import math
    all_obs_filtered = [o for o in all_obs if o.species_name and o.species_name != "Unknown Species"]
    total_animals = sum(o.count for o in all_obs_filtered)
    species_counts_all = {}
    for o in all_obs_filtered:
        species_counts_all[o.species_name] = species_counts_all.get(o.species_name, 0) + o.count
        
    species_richness = len(species_counts_all)
    
    if total_animals > 0:
        proportions = [count / total_animals for count in species_counts_all.values()]
        shannon = -sum(p * math.log(p) for p in proportions if p > 0)
        simpson = 1 - sum(p * p for p in proportions)
    else:
        shannon = 0.0
        simpson = 0.0
        
    print(f"Shannon: {shannon}, Simpson: {simpson}, Richness: {species_richness}, Total Animals: {total_animals}")
    print("Everything runs cleanly without exceptions!")
except Exception as e:
    print("Failed with exception:", e)
    import traceback
    traceback.print_exc()
