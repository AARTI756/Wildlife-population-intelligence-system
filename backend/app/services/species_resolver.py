"""
Shared Species Profile Resolver Service

Provides a centralized matching engine used by both the Image (YOLO) and
Audio (BirdNET) analysis pipelines to look up SpeciesProfile records.

Matching priority:
  1. SpeciesCatalog lookup
  2. Database fallback
  3. Gemini enrichment
  4. Catalog append and persistence
"""

import logging
import difflib
import re
from sqlalchemy.orm import Session

from app.models.species import SpeciesProfile
from app.services.gemini_service import generate_species_profile
from app.services.species_catalog import species_catalog, validate_profile

logger = logging.getLogger(__name__)

# Canonical alias dictionary — maps common AI prediction names to
# the corresponding SpeciesProfile.common_name stored in the database.
SPECIES_ALIASES = {
    "peacock": "peafowl",
    "peafowls": "peafowl",
    "indian peafowl": "peafowl",
    "bull": "gaur",
    "indian bison": "gaur",
    "bison": "gaur",
    "tiger": "bengal tiger",
    "panthera tigris": "bengal tiger",
    "panthera pardus": "indian leopard",
    "leopard": "indian leopard",
    "elephant": "asian elephant",
    "elephas maximus": "asian elephant",
    "wild boar": "indian boar",
    "sus scrofa": "indian boar",
    "boar": "indian boar",
    "chital": "spotted deer",
    "axis axis": "spotted deer",
    "sambar": "sambar deer",
    "rusa unicolor": "sambar deer",
    "monkey": "bonnet macaque",
    "macaque": "bonnet macaque",
    "macaca radiata": "bonnet macaque",
}


def _normalize(name: str) -> str:
    """Normalize a species name for fuzzy comparison."""
    return " ".join(re.sub(r"[^a-z0-9]+", " ", name.lower()).split())


def _upsert_profile_from_entry(entry: dict, db: Session, fallback_name: str) -> SpeciesProfile | None:
    payload = {
        "common_name": entry.get("common_name") or fallback_name,
        "scientific_name": entry.get("scientific_name") or fallback_name,
        "kingdom": entry.get("kingdom"),
        "phylum": entry.get("phylum"),
        "class_name": entry.get("class_name"),
        "order": entry.get("order"),
        "family": entry.get("family"),
        "genus": entry.get("genus"),
        "species": entry.get("species"),
        "iucn_status": entry.get("iucn_status"),
        "habitat": entry.get("habitat"),
        "diet": entry.get("diet"),
        "distribution": entry.get("distribution"),
        "description": entry.get("description"),
    }

    try:
        existing = None
        if payload.get("common_name"):
            existing = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(payload["common_name"])).first()
        if not existing and payload.get("scientific_name"):
            existing = db.query(SpeciesProfile).filter(SpeciesProfile.scientific_name.ilike(payload["scientific_name"])).first()

        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
            db.add(existing)
            db.commit()
            db.refresh(existing)
            species_catalog.record_database_store()
            return existing

        profile = SpeciesProfile(**payload)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        species_catalog.record_database_store()
        return profile
    except Exception:
        db.rollback()
        return None


def _lookup_db_profile(raw_species: str, db: Session) -> SpeciesProfile | None:
    cleaned_raw = raw_species.strip()
    profile = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(cleaned_raw)).first()
    if profile:
        return profile

    profile = db.query(SpeciesProfile).filter(SpeciesProfile.scientific_name.ilike(cleaned_raw)).first()
    if profile:
        return profile

    normalized_raw = _normalize(cleaned_raw)
    all_profiles = db.query(SpeciesProfile).all()

    for prof in all_profiles:
        if _normalize(prof.common_name) == normalized_raw or _normalize(prof.scientific_name) == normalized_raw:
            return prof

    for prof in all_profiles:
        prof_common = _normalize(prof.common_name)
        prof_sci = _normalize(prof.scientific_name)
        if (normalized_raw in prof_common) or (prof_common in normalized_raw) or (normalized_raw in prof_sci) or (prof_sci in normalized_raw):
            return prof

    best_match = None
    best_score = 0.0
    for prof in all_profiles:
        for candidate in (prof.common_name, prof.scientific_name):
            score = difflib.SequenceMatcher(None, normalized_raw, _normalize(candidate)).ratio()
            if score > best_score:
                best_score, best_match = score, prof
    if best_match and best_score >= 0.86:
        return best_match

    aliased_name = SPECIES_ALIASES.get(cleaned_raw.lower())
    if aliased_name:
        return db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(aliased_name)).first()

    return None


def resolve_species_profile(raw_species: str, db: Session):
    """Resolve a raw species prediction. If in 64 supported classes, use strict taxonomy database."""
    cleaned_raw = (raw_species or "").strip()
    
    # 1. Deterministic Taxonomy database lookup
    from app.data.taxonomy import lookup_taxonomy_profile
    tax_profile = lookup_taxonomy_profile(cleaned_raw)
    if tax_profile:
        existing = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(tax_profile["common_name"])).first()
        if not existing:
            existing = SpeciesProfile(
                common_name=tax_profile["common_name"],
                scientific_name=tax_profile["scientific_name"],
                kingdom=tax_profile["kingdom"],
                phylum=tax_profile["phylum"],
                class_name=tax_profile["class"],
                order=tax_profile["order"],
                family=tax_profile["family"],
                genus=tax_profile["genus"],
                species=tax_profile["common_name"].lower().replace(" ", "_"),
                iucn_status=tax_profile["iucn_status"],
                habitat=tax_profile["habitat"],
                diet=tax_profile["diet"],
                distribution=tax_profile["distribution"],
                description=f"Curated database profile for {tax_profile['common_name']}."
            )
            db.add(existing)
            db.commit()
            db.refresh(existing)
        else:
            # Stale record repair: update fields if they are missing or Data unavailable
            updated = False
            for field, tax_key in [
                ("order", "order"),
                ("family", "family"),
                ("genus", "genus"),
                ("scientific_name", "scientific_name"),
                ("phylum", "phylum"),
                ("class_name", "class"),
                ("iucn_status", "iucn_status"),
                ("habitat", "habitat"),
                ("diet", "diet"),
                ("distribution", "distribution")
            ]:
                current_val = getattr(existing, field)
                if not current_val or current_val.strip().lower() in {"", "data unavailable", "n/a", "unknown", "none"}:
                    setattr(existing, field, tax_profile[tax_key])
                    updated = True
            if updated:
                db.add(existing)
                db.commit()
                db.refresh(existing)
        return existing

    # 2. Unsupported species or custom / BirdNET profiles
    catalog_entry = species_catalog.lookup(cleaned_raw)
    if catalog_entry:
        return SpeciesProfile(
            common_name=catalog_entry.get("common_name") or cleaned_raw,
            scientific_name=catalog_entry.get("scientific_name") or cleaned_raw,
            kingdom=catalog_entry.get("kingdom") or "Animalia",
            phylum=catalog_entry.get("phylum") or "Data unavailable",
            class_name=catalog_entry.get("class_name") or catalog_entry.get("class") or "Data unavailable",
            order=catalog_entry.get("order") or "Data unavailable",
            family=catalog_entry.get("family") or "Data unavailable",
            genus=catalog_entry.get("genus") or "Data unavailable",
            species=catalog_entry.get("species") or cleaned_raw,
            iucn_status=catalog_entry.get("iucn_status") or "Least Concern",
            habitat=catalog_entry.get("habitat") or "Data unavailable",
            diet=catalog_entry.get("diet") or "Data unavailable",
            distribution=catalog_entry.get("distribution") or "Data unavailable",
            description=catalog_entry.get("description") or "Data unavailable",
        )
        
    db_profile = _lookup_db_profile(cleaned_raw, db)
    if db_profile:
        return db_profile
        
    # Unverified / Fallback (corresponds to "Species Requires Verification")
    return SpeciesProfile(
        common_name=cleaned_raw,
        scientific_name=cleaned_raw,
        kingdom="Animalia",
        phylum="Data unavailable",
        class_name="Data unavailable",
        order="Data unavailable",
        family="Data unavailable",
        genus="Data unavailable",
        species=cleaned_raw,
        iucn_status="Least Concern",
        habitat="Data unavailable",
        diet="Data unavailable",
        distribution="Data unavailable",
        description="Data unavailable"
    )


def clean_val(val, field_name, common_name):
    cleaned = str(val).strip() if val is not None else ""
    if not cleaned or cleaned.lower() in {"unavailable", "n/a", "unknown", "missing", "none", "not available"}:
        return "Data unavailable"
    return cleaned


def build_profile_data(profile):
    """
    Build a standardized profile_data dict from a matched SpeciesProfile.
    Returns a dict with taxonomy, habitat, diet, etc., free of placeholders.
    """
    common_name = profile.common_name or "Species Requires Verification"
    
    # 1. Deterministic lookup
    from app.data.taxonomy import lookup_taxonomy_profile
    tax_profile = lookup_taxonomy_profile(common_name)
    if tax_profile:
        return {
            "scientific_name": tax_profile["scientific_name"],
            "common_name": tax_profile["common_name"],
            "taxonomy": {
                "kingdom": tax_profile["kingdom"],
                "phylum": tax_profile["phylum"],
                "class": tax_profile["class"],
                "order": tax_profile["order"],
                "family": tax_profile["family"],
                "genus": tax_profile["genus"],
                "species": tax_profile["common_name"].lower().replace(" ", "_"),
            },
            "habitat": tax_profile["habitat"],
            "diet": tax_profile["diet"],
            "iucn_status": tax_profile["iucn_status"],
            "distribution": tax_profile["distribution"],
            "description": f"Curated database profile for {tax_profile['common_name']}.",
            "conservation_priority": "Routine Monitoring",
            "threat_level": "Low Risk",
            "protection_recommendation": "Standard reserve surveillance.",
            "human_wildlife_conflict_risk": "Low Risk",
            "anti_poaching_recommendation": "Standard camera trap patrols.",
            "behaviour_hints": "Most active during daytime.",
        }

    # 2. Unsupported / Verification fallback
    return {
        "scientific_name": profile.scientific_name or "Data unavailable",
        "common_name": common_name,
        "taxonomy": {
            "kingdom": profile.kingdom or "Animalia",
            "phylum": profile.phylum or "Data unavailable",
            "class": profile.class_name or "Data unavailable",
            "order": profile.order or "Data unavailable",
            "family": profile.family or "Data unavailable",
            "genus": profile.genus or "Data unavailable",
            "species": profile.species or "Data unavailable",
        },
        "habitat": profile.habitat or "Data unavailable",
        "diet": profile.diet or "Data unavailable",
        "iucn_status": profile.iucn_status or "Least Concern",
        "distribution": profile.distribution or "Data unavailable",
        "description": profile.description or "Data unavailable",
        "conservation_priority": "Data unavailable",
        "threat_level": "Data unavailable",
        "protection_recommendation": "Data unavailable",
        "human_wildlife_conflict_risk": "Data unavailable",
        "anti_poaching_recommendation": "Data unavailable",
        "behaviour_hints": "Data unavailable",
    }


def build_empty_profile_data(raw_species: str):
    """
    Build a stub profile_data dict when no SpeciesProfile is found.
    Preserves the raw AI prediction and uses safe fallbacks.
    """
    common_name = raw_species.replace("-", " ").title()
    
    # 1. Deterministic lookup
    from app.data.taxonomy import lookup_taxonomy_profile
    tax_profile = lookup_taxonomy_profile(raw_species)
    if tax_profile:
        return {
            "scientific_name": tax_profile["scientific_name"],
            "common_name": tax_profile["common_name"],
            "taxonomy": {
                "kingdom": tax_profile["kingdom"],
                "phylum": tax_profile["phylum"],
                "class": tax_profile["class"],
                "order": tax_profile["order"],
                "family": tax_profile["family"],
                "genus": tax_profile["genus"],
                "species": tax_profile["common_name"].lower().replace(" ", "_"),
            },
            "habitat": tax_profile["habitat"],
            "diet": tax_profile["diet"],
            "iucn_status": tax_profile["iucn_status"],
            "distribution": tax_profile["distribution"],
            "description": f"Curated database profile for {tax_profile['common_name']}.",
            "conservation_priority": "Routine Monitoring",
            "threat_level": "Low Risk",
            "protection_recommendation": "Standard reserve surveillance.",
            "human_wildlife_conflict_risk": "Low Risk",
            "anti_poaching_recommendation": "Standard camera trap patrols.",
            "behaviour_hints": "Most active during daytime.",
        }

    # 2. Species Catalog lookup (fallback for BirdNET and other cataloged species)
    catalog_entry = species_catalog.lookup(raw_species)
    if catalog_entry:
        return {
            "scientific_name": catalog_entry.get("scientific_name") or "Data unavailable",
            "common_name": catalog_entry.get("common_name") or common_name,
            "taxonomy": {
                "kingdom": catalog_entry.get("kingdom") or "Animalia",
                "phylum": catalog_entry.get("phylum") or "Data unavailable",
                "class": catalog_entry.get("class_name") or catalog_entry.get("class") or "Data unavailable",
                "order": catalog_entry.get("order") or "Data unavailable",
                "family": catalog_entry.get("family") or "Data unavailable",
                "genus": catalog_entry.get("genus") or "Data unavailable",
                "species": catalog_entry.get("species") or raw_species.lower().replace(" ", "_"),
            },
            "habitat": catalog_entry.get("habitat") or "Data unavailable",
            "diet": catalog_entry.get("diet") or "Data unavailable",
            "iucn_status": catalog_entry.get("iucn_status") or "Least Concern",
            "distribution": catalog_entry.get("distribution") or "Data unavailable",
            "description": catalog_entry.get("description") or "Data unavailable",
            "conservation_priority": catalog_entry.get("conservation_priority") or "Routine Monitoring",
            "threat_level": catalog_entry.get("threat_level") or "Low Risk",
            "protection_recommendation": catalog_entry.get("protection_recommendation") or "Standard reserve surveillance.",
            "human_wildlife_conflict_risk": catalog_entry.get("human_wildlife_conflict_risk") or "Low Risk",
            "anti_poaching_recommendation": catalog_entry.get("anti_poaching_recommendation") or "Standard camera trap patrols.",
            "behaviour_hints": catalog_entry.get("behaviour_hints") or "Most active during daytime.",
        }

    # 3. Minimal stub fallback for completely unknown species
    return {
        "scientific_name": "Data unavailable",
        "common_name": common_name,
        "taxonomy": {
            "kingdom": "Animalia",
            "phylum": "Data unavailable",
            "class": "Data unavailable",
            "order": "Data unavailable",
            "family": "Data unavailable",
            "genus": "Data unavailable",
            "species": "Data unavailable",
        },
        "habitat": "Data unavailable",
        "diet": "Data unavailable",
        "iucn_status": "Least Concern",
        "distribution": "Data unavailable",
        "description": "Data unavailable",
        "conservation_priority": "Data unavailable",
        "threat_level": "Data unavailable",
        "protection_recommendation": "Data unavailable",
        "human_wildlife_conflict_risk": "Data unavailable",
        "anti_poaching_recommendation": "Data unavailable",
        "behaviour_hints": "Data unavailable",
    }
