import os
import sys

# Add backend app directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database.connection import SessionLocal
from app.models.observation import Observation
from app.models.monitoring import Survey, MonitoringSite
from app.models.species import SpeciesProfile

def main():
    db = SessionLocal()
    try:
        obs_count = db.query(Observation).count()
        survey_count = db.query(Survey).count()
        site_count = db.query(MonitoringSite).count()
        species_count = db.query(SpeciesProfile).count()
        
        print(f"Observations Count: {obs_count}")
        print(f"Surveys Count: {survey_count}")
        print(f"Monitoring Sites Count: {site_count}")
        print(f"Species Profiles Count: {species_count}")
        
        if obs_count > 0:
            print("\nSample Observations:")
            for o in db.query(Observation).limit(5).all():
                print(f"ID: {o.id}, Species: {o.species_name}, Count: {o.count}, Timestamp: {o.timestamp}, Site: {o.monitoring_site_id}, Survey: {o.survey_id}")
                
        if species_count > 0:
            print("\nSample Species Profiles:")
            for s in db.query(SpeciesProfile).limit(5).all():
                print(f"ID: {s.id}, Common: {s.common_name}, Scientific: {s.scientific_name}, IUCN: {s.iucn_status}")
                
    except Exception as e:
        print("Error inspecting database:", e)
    finally:
        db.close()

if __name__ == '__main__':
    main()
