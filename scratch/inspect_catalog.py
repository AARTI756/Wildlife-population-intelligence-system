import json
import os

catalog_path = "backend/data/species_catalog.json"

yolo_classes = [
    'Bear', 'Brown-bear', 'Bull', 'Butterfly', 'Camel', 'Canary', 'Cat', 'Caterpillar', 'Cattle', 'Centipede', 
    'Cheetah', 'Chicken', 'Deer', 'Dog', 'Duck', 'Eagle', 'Elephant', 'Fox', 'Frog', 'Giraffe', 'Goat', 'Goose', 
    'Hamster', 'Hedgehog', 'Hippopotamus', 'Horse', 'Jellyfish', 'Kangaroo', 'Koala', 'Ladybug', 'Leopard', 
    'Lion', 'Lizard', 'Lynx', 'Magpie', 'Monkey', 'Moths-and-butterflies', 'Mouse', 'Mule', 'Ostrich', 'Otter', 
    'Owl', 'Panda', 'Parrot', 'Peacock', 'Pig', 'Polar-bear', 'Rabbit', 'Raccoon', 'Raven', 'Red-panda', 
    'Rhinoceros', 'Scorpion', 'Sheep', 'Snake', 'Sparrow', 'Spider', 'Swan', 'Tiger', 'Turkey', 'Wild Boar', 
    'Wolf', 'Woodpecker', 'Zebra'
]

required_fields = [
    "common_name", "scientific_name", "kingdom", "phylum", "class", "order", "family", "genus", "species",
    "habitat", "distribution", "diet", "description", "iucn_status", "threat_level", "conservation_priority",
    "protection_recommendation", "human_wildlife_conflict_risk", "anti_poaching_recommendation", "behaviour_hints"
]

if os.path.exists(catalog_path):
    with open(catalog_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    catalog = data.get("species", [])
    print(f"Catalog contains {len(catalog)} entries.")
    
    # We want to check matching for each yolo class
    missing_classes = []
    incomplete_classes = {}
    
    for yc in yolo_classes:
        # Try matching by name
        norm_yc = yc.lower().replace("-", " ")
        match = None
        for entry in catalog:
            common = entry.get("common_name", "").lower().replace("-", " ")
            scientific = entry.get("scientific_name", "").lower()
            aliases = [a.lower().replace("-", " ") for a in entry.get("aliases", [])]
            if norm_yc == common or norm_yc == scientific or norm_yc in aliases:
                match = entry
                break
                
        if not match:
            missing_classes.append(yc)
        else:
            # Check fields
            missing_fields = []
            placeholder_fields = []
            placeholders = ["unavailable", "n/a", "unknown", "placeholder", "tbd", "none", "empty"]
            for field in required_fields:
                val = match.get(field)
                if val is None or str(val).strip() == "":
                    missing_fields.append(field)
                elif any(p in str(val).lower() for p in placeholders):
                    # Exception: "Least Concern" is valid, but let's check
                    if field == "iucn_status" and "concern" in str(val).lower():
                        continue
                    placeholder_fields.append(field)
                    
            if missing_fields or placeholder_fields:
                incomplete_classes[yc] = {
                    "missing": missing_fields,
                    "placeholder": placeholder_fields,
                    "matched_common_name": match.get("common_name")
                }
                
    print("\nMissing Classes entirely:", missing_classes)
    print("\nIncomplete Classes:", len(incomplete_classes))
    for k, v in list(incomplete_classes.items())[:10]:
        print(f"  {k}: Matched as '{v['matched_common_name']}' - Missing: {v['missing']}, Placeholders: {v['placeholder']}")
else:
    print("Catalog not found!")
