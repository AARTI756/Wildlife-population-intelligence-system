import logging
from app.models.species import SpeciesProfile
from app.services.gemini_service import generate_species_profile
from app.services.species_catalog import species_catalog, validate_profile

logger = logging.getLogger(__name__)


def _build_profile_payload(entry: dict, fallback_name: str) -> dict:
    allowed = {column.name for column in SpeciesProfile.__table__.columns if column.name != "id"}
    payload = {key: entry.get(key) for key in allowed if key in entry}
    if not payload.get("common_name"):
        payload["common_name"] = fallback_name
    return payload


def _upsert_species_profile(entry: dict, db, fallback_name: str) -> SpeciesProfile | None:
    payload = _build_profile_payload(entry, fallback_name)
    if not payload.get("common_name") or not payload.get("scientific_name"):
        return None

    try:
        existing = None
        common_name = payload.get("common_name") or ""
        scientific_name = payload.get("scientific_name") or ""

        if common_name:
            existing = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(common_name)).first()
        if not existing and scientific_name:
            existing = db.query(SpeciesProfile).filter(SpeciesProfile.scientific_name.ilike(scientific_name)).first()

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
        logger.exception("Could not persist species profile for %s", fallback_name)
        return None


def enrich_missing_profile(raw_species, db):
    """Resolve a species profile using the catalog first, then Gemini, and persist to the database."""
    lookup_name = (raw_species or "").strip()
    if not lookup_name:
        return None

    # 1. Deterministic Taxonomy database lookup
    from app.data.taxonomy import lookup_taxonomy_profile
    tax_profile = lookup_taxonomy_profile(lookup_name)
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
        return existing

    # 2. Otherwise fall back to standard catalog and Gemini
    catalog_entry = species_catalog.lookup(lookup_name)
    if catalog_entry:
        payload = _build_profile_payload(catalog_entry, lookup_name)
        return SpeciesProfile(**payload)

    db_profile = None
    common_name = lookup_name
    scientific_name = lookup_name
    if common_name:
        db_profile = db.query(SpeciesProfile).filter(SpeciesProfile.common_name.ilike(common_name)).first()
    if not db_profile and scientific_name:
        db_profile = db.query(SpeciesProfile).filter(SpeciesProfile.scientific_name.ilike(scientific_name)).first()
    if db_profile:
        entry = {
            "common_name": db_profile.common_name,
            "scientific_name": db_profile.scientific_name,
            "kingdom": db_profile.kingdom,
            "phylum": db_profile.phylum,
            "class_name": db_profile.class_name,
            "order": db_profile.order,
            "family": db_profile.family,
            "genus": db_profile.genus,
            "species": db_profile.species,
            "iucn_status": db_profile.iucn_status,
            "habitat": db_profile.habitat,
            "diet": db_profile.diet,
            "distribution": db_profile.distribution,
            "description": db_profile.description,
        }
        species_catalog.append(entry, lookup_name, source="database")
        return db_profile

    logger.info("[Gemini] Generating new species profile...")
    gemini_profile = generate_species_profile(lookup_name)
    if not validate_profile(gemini_profile, lookup_name):
        logger.warning("Gemini did not return a valid profile for %s", lookup_name)
        fallback_profile = {
            "common_name": lookup_name,
            "scientific_name": lookup_name,
            "kingdom": "Animalia",
            "phylum": "Data unavailable",
            "class_name": "Data unavailable",
            "order": "Data unavailable",
            "family": "Data unavailable",
            "genus": "Data unavailable",
            "species": lookup_name,
            "iucn_status": "Least Concern",
            "habitat": "Data unavailable",
            "diet": "Data unavailable",
            "distribution": "Data unavailable",
            "description": "Data unavailable"
        }
        appended_entry = species_catalog.append(fallback_profile, lookup_name, source="gemini")
        if not appended_entry:
            payload = _build_profile_payload(fallback_profile, lookup_name)
            return SpeciesProfile(**payload)
        return _upsert_species_profile(appended_entry, db, lookup_name)

    appended_entry = species_catalog.append(gemini_profile, lookup_name, source="gemini")
    if not appended_entry:
        payload = _build_profile_payload(gemini_profile, lookup_name)
        return SpeciesProfile(**payload)
    return _upsert_species_profile(appended_entry, db, lookup_name)
