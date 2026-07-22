"""
Species Lookup Service using species_catalog.json as official knowledge base.
"""
from typing import Dict, Any
from app.services.species_catalog import species_catalog, normalize_entry

def lookup_species_profile(raw_species: str) -> Dict[str, Any]:
    """
    Search species catalog in order: Common Name, Scientific Name, Aliases.
    Return complete profile or {"profile_not_found": True}.
    """
    if not raw_species:
        return {"profile_not_found": True}
        
    # Ensure catalog is loaded
    if not species_catalog.loaded:
        species_catalog.load()
        
    entry = species_catalog.lookup(raw_species)
    if entry:
        normalized = normalize_entry(entry)
        return {
            "common_name": normalized.get("common_name"),
            "scientific_name": normalized.get("scientific_name"),
            "kingdom": normalized.get("kingdom"),
            "phylum": normalized.get("phylum"),
            "class_name": normalized.get("class_name"),
            "order": normalized.get("order"),
            "family": normalized.get("family"),
            "genus": normalized.get("genus"),
            "species": normalized.get("species"),
            "iucn_status": normalized.get("iucn_status"),
            "diet": normalized.get("diet"),
            "habitat": normalized.get("habitat"),
            "distribution": normalized.get("distribution"),
            "description": normalized.get("description"),
            "conservation_priority": normalized.get("conservation_priority"),
            "threat_level": normalized.get("threat_level"),
            "aliases": normalized.get("aliases"),
            "protection_recommendation": normalized.get("protection_recommendation"),
            "human_wildlife_conflict_risk": normalized.get("human_wildlife_conflict_risk"),
            "anti_poaching_recommendation": normalized.get("anti_poaching_recommendation"),
            "behaviour_hints": normalized.get("behaviour_hints"),
        }
        
    return {"profile_not_found": True}
