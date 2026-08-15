import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.database.connection import SessionLocal
from app.models.species import SpeciesProfile

def seed_missing():
    db = SessionLocal()
    try:
        # 1. Rename existing 'Koel' profile to 'Asian Koel' and update details
        koel_profile = db.query(SpeciesProfile).filter(
            (SpeciesProfile.common_name == "Koel") | 
            (SpeciesProfile.common_name == "Asian Koel")
        ).first()
        
        if koel_profile:
            koel_profile.common_name = "Asian Koel"
            koel_profile.scientific_name = "Eudynamys scolopaceus"
            koel_profile.class_name = "Aves"
            koel_profile.iucn_status = "Least Concern"
            koel_profile.description = "The Asian koel is a member of the cuckoo order of birds, the Cuculiformes. It is found in the Indian subcontinent, China, and Southeast Asia."
            db.add(koel_profile)
            print("Asian Koel profile updated/ensured.")
        else:
            new_koel = SpeciesProfile(
                common_name="Asian Koel",
                scientific_name="Eudynamys scolopaceus",
                class_name="Aves",
                iucn_status="Least Concern",
                kingdom="Animalia",
                phylum="Chordata",
                description="The Asian koel is a member of the cuckoo order of birds, the Cuculiformes. It is found in the Indian subcontinent, China, and Southeast Asia."
            )
            db.add(new_koel)
            print("Asian Koel profile created.")

        # 2. Add Jungle Babbler
        babbler = db.query(SpeciesProfile).filter(SpeciesProfile.common_name == "Jungle Babbler").first()
        if not babbler:
            new_babbler = SpeciesProfile(
                common_name="Jungle Babbler",
                scientific_name="Turdoides striata",
                class_name="Aves",
                iucn_status="Least Concern",
                kingdom="Animalia",
                phylum="Chordata",
                description="The jungle babbler is a member of the family Leiothrichidae common in the Indian subcontinent. They are gregarious birds that forage in small groups, giving them the local name 'Seven Sisters'."
            )
            db.add(new_babbler)
            print("Jungle Babbler profile created.")
        else:
            print("Jungle Babbler profile already exists.")

        # 3. Add Carrion Crow
        crow = db.query(SpeciesProfile).filter(SpeciesProfile.common_name == "Carrion Crow").first()
        if not crow:
            new_crow = SpeciesProfile(
                common_name="Carrion Crow",
                scientific_name="Corvus corone",
                class_name="Aves",
                iucn_status="Least Concern",
                kingdom="Animalia",
                phylum="Chordata",
                description="The carrion crow is a passerine bird of the family Corvidae and the genus Corvus, native to western Europe and eastern Asia."
            )
            db.add(new_crow)
            print("Carrion Crow profile created.")
        else:
            print("Carrion Crow profile already exists.")

        # 4. Clean up any duplicated scientific names or other anomalies in other profiles
        db.commit()
        print("Seeding missing species completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_missing()
