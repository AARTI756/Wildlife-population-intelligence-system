import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.database.connection import SessionLocal
from app.models.species import SpeciesProfile

def check_names():
    db = SessionLocal()
    try:
        search_terms = ["tiger", "crow", "rhinoceros", "babbler", "koel", "hawk"]
        for term in search_terms:
            results = db.query(SpeciesProfile).filter(
                (SpeciesProfile.common_name.ilike(f"%{term}%")) | 
                (SpeciesProfile.scientific_name.ilike(f"%{term}%"))
            ).all()
            print(f"Results for term '{term}':")
            for r in results:
                print(f"  ID: {r.id} | Common: '{r.common_name}' | Scientific: '{r.scientific_name}' | Class: '{r.class_name}' | IUCN: '{r.iucn_status}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_names()
