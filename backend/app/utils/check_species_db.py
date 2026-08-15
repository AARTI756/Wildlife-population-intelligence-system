import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.database.connection import SessionLocal
from app.models.species import SpeciesProfile
from app.models.observation import Observation
from sqlalchemy import func

def print_species_issues():
    db = SessionLocal()
    try:
        profiles = db.query(SpeciesProfile).all()
        print(f"Total Species Profiles: {len(profiles)}")
        print("\nSpecies Profiles with None/empty fields:")
        for p in profiles:
            is_none_field = (
                p.scientific_name is None or p.scientific_name == "None" or
                p.class_name is None or p.class_name == "None" or
                p.iucn_status is None or p.iucn_status == "None"
            )
            if is_none_field:
                print(f"  ID: {p.id} | Common Name: '{p.common_name}' | Sci Name: '{p.scientific_name}' | Class: '{p.class_name}' | IUCN: '{p.iucn_status}'")
                
        print("\nObservations with species names not found in SpeciesProfile:")
        obs_species = db.query(Observation.species_name, func.count(Observation.id)).group_by(Observation.species_name).all()
        profiles_map = {p.common_name.lower().strip(): p for p in profiles}
        profiles_map.update({p.scientific_name.lower().strip(): p for p in profiles if p.scientific_name})
        
        for name, count in obs_species:
            if not name:
                continue
            normalized = name.lower().strip()
            if normalized not in profiles_map:
                print(f"  Species Name in Obs: '{name}' (Count: {count}) — NOT IN SPECIES_PROFILES")
                
    finally:
        db.close()

if __name__ == "__main__":
    print_species_issues()
