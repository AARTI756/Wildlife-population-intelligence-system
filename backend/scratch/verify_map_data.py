import json
from datetime import datetime
from app.database.connection import SessionLocal
from app.services.executive_dashboard import get_executive_map_pins
from app.services.population_estimation import get_site_densities, get_migration_patterns, get_species_distribution_map

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def main():
    db = SessionLocal()
    print("Database connection opened.")
    
    print("\n--- Testing get_executive_map_pins ---")
    pins = get_executive_map_pins(db)
    print(f"Total pins returned: {len(pins)}")
    valid_pins = []
    invalid_pins = []
    for idx, p in enumerate(pins):
        lat = p.get("lat") or p.get("latitude")
        lng = p.get("lng") or p.get("longitude")
        if lat is None or lng is None:
            invalid_pins.append(p)
        else:
            valid_pins.append(p)
    print(f"Valid coordinates: {len(valid_pins)}, Invalid: {len(invalid_pins)}")
    if invalid_pins:
        print("Invalid Pins Sample:", invalid_pins[:3])
    print("Sample Pins (up to 3):")
    print(json.dumps(pins[:3], indent=2, cls=DateTimeEncoder))
    
    print("\n--- Testing get_site_densities ---")
    densities = get_site_densities(db)
    print(f"Total density sites returned: {len(densities)}")
    valid_densities = []
    invalid_densities = []
    for d in densities:
        lat = d.get("latitude")
        lng = d.get("longitude")
        if lat is None or lng is None:
            invalid_densities.append(d)
        else:
            valid_densities.append(d)
    print(f"Valid coordinates: {len(valid_densities)}, Invalid: {len(invalid_densities)}")
    if invalid_densities:
        print("Invalid Densities Sample:", invalid_densities[:3])
    print("Sample Densities (up to 3):")
    print(json.dumps(densities[:3], indent=2, cls=DateTimeEncoder))
    
    print("\n--- Testing get_migration_patterns ---")
    migrations = get_migration_patterns(db)
    print(f"Total migration vectors returned: {len(migrations)}")
    valid_migrations = []
    invalid_migrations = []
    for m in migrations:
        lat1 = m.get("first_lat")
        lng1 = m.get("first_lng")
        lat2 = m.get("second_lat")
        lng2 = m.get("second_lng")
        if None in (lat1, lng1, lat2, lng2):
            invalid_migrations.append(m)
        else:
            valid_migrations.append(m)
    print(f"Valid coordinates: {len(valid_migrations)}, Invalid: {len(invalid_migrations)}")
    if invalid_migrations:
        print("Invalid Migrations Sample:", invalid_migrations[:3])
    print("Sample Migrations (up to 3):")
    print(json.dumps(migrations[:3], indent=2, cls=DateTimeEncoder))
    
    print("\n--- Testing get_species_distribution_map ---")
    distributions = get_species_distribution_map(db)
    print(f"Total distribution points returned: {len(distributions)}")
    valid_dist = []
    invalid_dist = []
    for dist in distributions:
        lat = dist.get("lat") or dist.get("latitude")
        lng = dist.get("lng") or dist.get("longitude")
        if lat is None or lng is None:
            invalid_dist.append(dist)
        else:
            valid_dist.append(dist)
    print(f"Valid coordinates: {len(valid_dist)}, Invalid: {len(invalid_dist)}")
    if invalid_dist:
        print("Invalid Distributions Sample:", invalid_dist[:3])
    print("Sample Distributions (up to 3):")
    print(json.dumps(distributions[:3], indent=2, cls=DateTimeEncoder))
    
    db.close()
    print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
